# Sprint 13 Execution Plan - Data-Driven Optimization

**Sprint**: Sprint 13 - Data-Driven Optimization
**Planned Start**: October 22, 2025
**Duration**: 5 days
**Methodology**: JFR profiling-driven, one-change-at-a-time optimization

---

## Executive Summary

Sprint 13 leverages Sprint 12's JFR profiling infrastructure to implement **data-driven optimizations** based on empirical bottleneck identification. Unlike Sprint 12's failed blind tuning (Phase 3C), Sprint 13 will use actual profiling data to guide each optimization decision.

**Primary Goal**: Increase TPS from Phase 1 baseline (1.14M) to 1.5M+ through targeted, evidence-based optimizations.

**Methodology**: Analyze JFR profiling data → Identify top 3 bottlenecks → Optimize one at a time → Validate → Iterate.

---

## Sprint Objectives

### Priority 1: JFR Profile Analysis (Days 1-2)

**Objective**: Analyze Sprint 12's JFR recording to identify actual bottlenecks (not assumptions).

**Tasks**:
1. **Retrieve JFR file** from remote server
2. **Analyze with JDK Mission Control**:
   - CPU hotspots (method profiling)
   - GC behavior (pause times, heap usage)
   - Memory allocation patterns
   - Thread contention metrics
   - I/O operations
3. **Identify top 3 bottlenecks** with quantitative data
4. **Formulate optimization hypotheses** backed by profiling evidence
5. **Document findings** in `SPRINT13_JFR_ANALYSIS.md`

**Expected Outcomes**:
- Top 3 CPU-consuming methods identified (with % CPU time)
- GC overhead quantified (total pause time, frequency)
- Allocation hotspots ranked (top 5 allocating classes)
- Thread contention measured (if significant)
- **Data-driven optimization priorities** established

**Success Criteria**:
- ✅ All JFR data categories analyzed
- ✅ At least 3 optimization opportunities identified
- ✅ Each opportunity quantified (% impact potential)

---

### Priority 2: Incremental Optimizations (Days 2-4)

**Objective**: Implement and validate optimizations one at a time based on JFR findings.

#### Phase 4A: Optimize Top Bottleneck

**Hypothesis**: TBD based on JFR analysis (examples below)

**Possible Scenarios**:

**Scenario A: CPU-bound (Transaction Processing)**
- **If profiling shows**: `TransactionService.processTransaction()` consumes >15% CPU
- **Optimization**: Algorithmic improvement (reduce computational complexity)
- **Testing**: 5 iterations on remote server
- **Target**: +10-15% TPS improvement

**Scenario B: CPU-bound (Data Structure Overhead)**
- **If profiling shows**: `ConcurrentHashMap.get()` consumes >10% CPU
- **Optimization**: Switch to read-optimized data structure (StampedLock + HashMap)
- **Testing**: 5 iterations on remote server
- **Target**: +8-12% TPS improvement

**Scenario C: GC-bound (Young Generation)**
- **If profiling shows**: GC pause time >5% of total runtime
- **Optimization**: Increase young gen size based on actual allocation rate
- **Testing**: 5 iterations on remote server
- **Target**: +5-8% TPS improvement

**Scenario D: Contention-bound (Queue Operations)**
- **If profiling shows**: `BlockingQueue` contention >100 events/second
- **Optimization**: Replace with lock-free queue (JCTools MpscArrayQueue)
- **Testing**: 5 iterations on remote server
- **Target**: +6-10% TPS improvement

**Process**:
1. Implement optimization (single code or JVM change)
2. Build and upload JAR to remote server
3. Run 5 performance test iterations
4. Compare to Phase 1 baseline (1.14M TPS)
5. **Decision**: Keep if +5% improvement, reject if regression

**Success Criteria**:
- ✅ Optimization implements JFR-identified fix
- ✅ 5 test iterations completed
- ✅ +5% TPS minimum (1.20M TPS threshold)
- ✅ Stability maintained (CV <10%)

#### Phase 4B: Optimize Second Bottleneck

**Baseline**: Phase 4A result (if successful) or Phase 1 baseline (if Phase 4A rejected)

**Process**: Same as Phase 4A (one change, 5 tests, keep/reject decision)

**Target**: Cumulative +15-20% TPS over Phase 1 baseline

**Success Criteria**:
- ✅ Independent of Phase 4A (no interaction effects)
- ✅ +5% TPS over previous phase
- ✅ Cumulative improvement tracked

#### Phase 4C: Optimize Third Bottleneck

**Baseline**: Best performing configuration from Phase 4A/4B

**Process**: Same as Phase 4A/4B

**Target**: Cumulative +20-30% TPS over Phase 1 baseline (1.48M - 1.63M TPS)

**Success Criteria**:
- ✅ Three independent optimizations validated
- ✅ Cumulative TPS gain documented
- ✅ No regressions introduced

---

### Priority 3: Consolidated Optimization Validation (Days 4-5)

**Objective**: Validate combined optimizations and establish Sprint 13 final baseline.

**Tasks**:
1. **Combine all successful optimizations** from Phases 4A, 4B, 4C
2. **Extended testing**: 10 iterations (vs standard 5) for statistical significance
3. **Stability analysis**: Measure coefficient of variation
4. **Performance comparison**:
   ```
   Phase 1 (Sprint 11): 1,143,802 TPS
   Phase 4A:            X TPS (+Y%)
   Phase 4B:            X TPS (+Y%)
   Phase 4C:            X TPS (+Y%)
   Sprint 13 Final:     X TPS (+Y% cumulative)
   ```
5. **Document in** `SPRINT13_EXECUTION_REPORT.md`

**Success Criteria**:
- ✅ Combined TPS ≥ 1.5M (primary goal)
- ✅ Stretch: Combined TPS ≥ 1.8M
- ✅ Stability: CV <10%
- ✅ No performance regressions vs individual phases

---

## Sprint Contingency Plans

### Contingency A: Minimal Bottlenecks Found

**If JFR profiling shows**: Performance is evenly distributed, no obvious hotspots

**Action**:
1. Review algorithmic complexity (O(n) vs O(1) operations)
2. Microbenchmark critical paths (JMH)
3. Consider architectural changes (async processing, batching)
4. **Or accept**: 1.14M TPS may be near-optimal for current architecture

**Pivot**: Shift Sprint 13 to native compilation completion (GraalVM upgrade)

### Contingency B: Single Dominant Bottleneck

**If JFR profiling shows**: One method consumes >40% CPU

**Action**:
1. Deep dive into bottleneck method
2. Multiple optimization attempts (algorithm, data structure, caching)
3. Expect high TPS gain (+50%+) from single fix

**Pivot**: Extend Sprint 13 if bottleneck requires significant refactoring

### Contingency C: GC is Primary Bottleneck

**If JFR profiling shows**: GC overhead >10% of runtime

**Action**:
1. Heap tuning based on actual allocation patterns (not guesses like Sprint 12)
2. Object pooling for high-allocation classes
3. Reduce allocations through algorithmic changes

**Pivot**: Combine GC tuning with code optimizations

### Contingency D: Native Compilation Priority

**If stakeholder decision**: Native deployment more urgent than TPS optimization

**Action**:
1. Pause JFR-driven optimization
2. Upgrade GraalVM to 23.2+ or 24.x
3. Complete native build (resolves Sprint 12 secondary issues)
4. Validate native performance vs JVM

**Pivot**: Return to profiling-driven optimization in Sprint 14

---

## Timeline & Milestones

### Day 1: JFR Analysis Setup

**Morning**:
- [ ] Retrieve JFR file from remote server
- [ ] Install/verify JDK Mission Control
- [ ] Open JFR file and familiarize with interface

**Afternoon**:
- [ ] Analyze CPU hotspots (method profiling)
- [ ] Analyze GC behavior (pause times, heap metrics)
- [ ] Initial findings documented

**Deliverable**: Draft JFR analysis with preliminary bottlenecks identified

---

### Day 2: Complete JFR Analysis & Start Phase 4A

**Morning**:
- [ ] Analyze memory allocation patterns
- [ ] Analyze thread contention
- [ ] Review I/O operations
- [ ] Finalize top 3 bottlenecks

**Afternoon**:
- [ ] Document `SPRINT13_JFR_ANALYSIS.md` (complete)
- [ ] Formulate Phase 4A optimization hypothesis
- [ ] Begin Phase 4A implementation

**Deliverable**: Complete JFR analysis document + Phase 4A optimization started

---

### Day 3: Phase 4A Testing & Phase 4B Start

**Morning**:
- [ ] Complete Phase 4A implementation
- [ ] Build and upload to remote server
- [ ] Run 5 performance tests
- [ ] Analyze Phase 4A results

**Afternoon**:
- [ ] **Decision**: Keep or reject Phase 4A
- [ ] Implement Phase 4B optimization
- [ ] Build and upload to remote server
- [ ] Run 5 performance tests

**Deliverable**: Phase 4A validation complete, Phase 4B testing done

---

### Day 4: Phase 4C & Consolidated Testing

**Morning**:
- [ ] Analyze Phase 4B results
- [ ] **Decision**: Keep or reject Phase 4B
- [ ] Implement Phase 4C optimization

**Afternoon**:
- [ ] Build and upload Phase 4C to remote server
- [ ] Run 5 performance tests
- [ ] **Decision**: Keep or reject Phase 4C

**Deliverable**: All three optimizations tested independently

---

### Day 5: Final Validation & Sprint 13 Report

**Morning**:
- [ ] Combine all successful optimizations
- [ ] Extended testing (10 iterations)
- [ ] Statistical analysis (mean, std dev, CV)

**Afternoon**:
- [ ] Document `SPRINT13_EXECUTION_REPORT.md`
- [ ] Update `TODO.md` with Sprint 13 completion
- [ ] Plan Sprint 14 priorities

**Deliverable**: Sprint 13 final report with validated TPS improvements

---

## Expected Outcomes

### Baseline Performance

**Sprint 11 (Phase 1)**:
- Average TPS: 1,143,802 (1.14M)
- Stability: High (low variance)
- Configuration: 10ms poll timeout, 2048 map capacity

### Sprint 13 Targets

**Conservative Scenario** (3 optimizations, +5% each):
```
Phase 1:     1,143,802 TPS  (baseline)
Phase 4A:    1,200,992 TPS  (+5.0%)
Phase 4B:    1,261,042 TPS  (+10.25%)
Phase 4C:    1,324,094 TPS  (+15.76%)

Sprint 13:   ~1.32M TPS     (+16% over baseline)
```

**Realistic Scenario** (mixed improvements):
```
Phase 1:     1,143,802 TPS  (baseline)
Phase 4A:    1,257,182 TPS  (+10% - major bottleneck)
Phase 4B:    1,319,991 TPS  (+5% - secondary fix)
Phase 4C:    1,385,991 TPS  (+5% - tertiary fix)

Sprint 13:   ~1.39M TPS     (+21% over baseline)
```

**Optimistic Scenario** (major bottleneck found):
```
Phase 1:     1,143,802 TPS  (baseline)
Phase 4A:    1,601,323 TPS  (+40% - algorithmic breakthrough)
Phase 4B:    1,681,389 TPS  (+5% - supplementary fix)
Phase 4C:    1,765,459 TPS  (+5% - final tuning)

Sprint 13:   ~1.77M TPS     (+54% over baseline)
```

**Stretch Goal**: 1.8M+ TPS (+57% over baseline)

---

## Methodology Principles

### 1. Data-Driven Decisions

**Every optimization must be backed by JFR profiling data**:
- ❌ "Let's try increasing heap size" (Sprint 12 Phase 3C approach)
- ✅ "GC pause time is 8% of runtime (JFR data), increase young gen by 50%"

### 2. One-Change-at-a-Time

**Continue Sprint 12's validated methodology**:
- Change exactly one variable per phase (code OR JVM flag)
- Clear attribution of results
- No confounding factors

### 3. Mandatory Testing

**Every optimization requires validation**:
- Minimum 5 iterations (standard)
- 10 iterations for final validation (statistical significance)
- Keep/reject decision based on +5% threshold

### 4. No Sunk Cost Fallacy

**Reject optimizations that don't perform**:
- Phase 3C regression taught us to pivot quickly
- If Phase 4A shows regression → immediate reject, move to 4B
- Time spent on failed optimization is not wasted (learned what doesn't work)

### 5. Cumulative Tracking

**Track improvements across phases**:
```
Phase 1 Baseline → Phase 4A → Phase 4B → Phase 4C → Sprint 13 Final
   1.14M TPS        ? TPS       ? TPS       ? TPS        ? TPS
```

**Document each phase** independently and cumulatively

---

## Tools & Infrastructure

### JFR Analysis Tools

**JDK Mission Control (Primary)**:
```bash
# macOS
brew install --cask jdk-mission-control

# Open JFR file
open aurigraph-sprint12-profile.jfr
```

**Command-Line Analysis (Secondary)**:
```bash
# Summary
jfr print aurigraph-sprint12-profile.jfr

# CPU hotspots
jfr print --events jdk.ExecutionSample aurigraph-sprint12-profile.jfr

# GC events
jfr print --events jdk.GCPhasePause aurigraph-sprint12-profile.jfr

# Allocations
jfr print --events jdk.ObjectAllocationInNewTLAB aurigraph-sprint12-profile.jfr

# JSON export for programmatic analysis
jfr print --json aurigraph-sprint12-profile.jfr > profile.json
```

### Performance Testing Infrastructure

**Remote Server**:
- Host: dlt.aurigraph.io:9003
- Phase 1 baseline JAR already uploaded
- Performance endpoint: `/api/v11/performance`

**Testing Script** (reuse from Sprint 12):
```bash
# Run 5 iterations
for i in {1..5}; do
  curl -s http://dlt.aurigraph.io:9003/api/v11/performance | jq '.transactionsPerSecond'
  sleep 2
done
```

### Build & Deployment

**Standard workflow**:
```bash
# Local build
./mvnw clean package -DskipTests

# Upload to remote server
scp target/aurigraph-v11-standalone-11.3.4-runner.jar \
    subbu@dlt.aurigraph.io:/opt/aurigraph-v11/aurigraph-v11-standalone-11.3.4-PHASE4A-runner.jar

# Start on remote server
ssh subbu@dlt.aurigraph.io "cd /opt/aurigraph-v11 && \
    pkill -f aurigraph-v11 && sleep 2 && \
    nohup java -jar aurigraph-v11-standalone-11.3.4-PHASE4A-runner.jar > logs/phase4a.log 2>&1 &"

# Wait for startup (5 seconds)
sleep 5

# Run performance tests
```

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **JFR shows no clear bottlenecks** | Low | High | Fall back to algorithmic analysis, microbenchmarking |
| **Optimizations introduce regressions** | Medium | Medium | One-change-at-a-time enables quick rollback |
| **JFR file corrupted/incomplete** | Low | High | Can restart profiling session if needed |
| **Combined optimizations conflict** | Low | Medium | Test individually first, then combined |
| **Diminishing returns** | Medium | Low | Accept 1.14M TPS as near-optimal |

### Schedule Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **JFR analysis takes longer than 2 days** | Low | Low | Extend Day 1-2, compress testing days |
| **Major refactoring needed** | Medium | Medium | Defer to Sprint 14 if >2 day effort |
| **Remote server unavailable** | Low | High | Local testing as fallback |

---

## Success Metrics

### Primary Metrics

1. **TPS Improvement**: ≥1.5M TPS (≥+31% over Phase 1 baseline)
2. **Stability**: Coefficient of Variation <10%
3. **Methodology Validation**: 3+ JFR-driven optimizations tested

### Secondary Metrics

4. **Attribution Clarity**: Each optimization's impact quantified independently
5. **Documentation Quality**: Complete JFR analysis + execution report
6. **Learning Value**: Understand actual bottlenecks vs assumptions

### Stretch Goals

7. **1.8M+ TPS**: +57% improvement (requires major bottleneck discovery)
8. **2M+ TPS**: Original target (likely requires architectural changes beyond Sprint 13)

---

## Dependencies & Prerequisites

### From Sprint 12 (Complete)

- [x] JFR profiling file recorded (30-minute session)
- [x] Phase 1 baseline performance established (1.14M TPS)
- [x] One-change-at-a-time methodology validated
- [x] Remote server infrastructure ready

### For Sprint 13 (To be completed Day 1)

- [ ] JFR file retrieved from remote server
- [ ] JDK Mission Control installed/verified
- [ ] JFR analysis skillset established (tutorials if needed)

---

## Sprint 13 Deliverables

### Documentation

1. **SPRINT13_JFR_ANALYSIS.md** - Complete profiling analysis (Days 1-2)
2. **SPRINT13_PHASE4A_FINDINGS.md** - Phase 4A optimization results (Day 3)
3. **SPRINT13_PHASE4B_FINDINGS.md** - Phase 4B optimization results (Day 3)
4. **SPRINT13_PHASE4C_FINDINGS.md** - Phase 4C optimization results (Day 4)
5. **SPRINT13_EXECUTION_REPORT.md** - Final sprint report (Day 5)

### Code Changes

- **Phase 4A**: TBD based on JFR analysis
- **Phase 4B**: TBD based on JFR analysis
- **Phase 4C**: TBD based on JFR analysis

**Estimate**: 3-10 files modified (algorithmic optimizations) or 0 files (JVM tuning only)

### Artifacts

- **JFR Analysis**: Charts, flame graphs, method profiles from JMC
- **Performance Data**: CSV/JSON of all test iterations
- **Sprint 13 Final JAR**: Combined optimizations (Phase 1 + 4A + 4B + 4C)

---

## Sprint 14 Preview

**If Sprint 13 achieves 1.5M+ TPS**:
- Sprint 14: Native compilation completion (GraalVM upgrade)
- Sprint 15: Aggressive optimization for 2M+ TPS
- Sprint 16: Production deployment

**If Sprint 13 < 1.5M TPS but >1.3M**:
- Sprint 14: Continued optimization (more profiling-driven work)
- Sprint 15: Native compilation
- Sprint 16: Final optimization push

**If Sprint 13 shows architectural limits**:
- Sprint 14: Architectural review (async processing, sharding, etc.)
- Sprint 15-16: Redesign for 2M+ TPS capability

---

## Conclusion

Sprint 13 represents a **paradigm shift** in Aurigraph optimization: from **trial-and-error** (Sprint 11 aggressive tuning, Sprint 12 blind JVM tuning) to **data-driven precision** (JFR profiling-guided optimizations).

**Key Success Factors**:
1. ✅ JFR profiling infrastructure (Sprint 12 deliverable)
2. ✅ Validated one-change-at-a-time methodology (Sprint 12 learning)
3. ✅ Clear baseline (Phase 1: 1.14M TPS)
4. ✅ Realistic targets (1.5M+, not unrealistic 2M immediately)
5. ✅ Pragmatic pivoting (reject what doesn't work, like Phase 3C)

**Expected Outcome**: Sprint 13 will deliver **measurable, validated, sustainable TPS improvements** based on empirical evidence, setting up Sprint 14+ for continued optimization success.

---

**Plan Author**: Claude Code
**Date**: October 21, 2025
**Based on**: Sprint 12 findings and JFR profiling framework
**Target**: 1.5M+ TPS through data-driven optimization
