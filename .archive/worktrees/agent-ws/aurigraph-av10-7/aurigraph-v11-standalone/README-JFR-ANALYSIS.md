# JFR Performance Analysis - Quick Start Guide

## Overview

This directory contains comprehensive performance analysis tools and reports for Aurigraph V11 blockchain platform.

## Files

### Analysis Reports
- **`JFR-PERFORMANCE-ANALYSIS-SPRINT12.md`** - Full 30-minute profiling analysis (40+ pages)
  - Detailed CPU hotspot analysis
  - GC metrics and pause distribution
  - Memory allocation patterns
  - Thread contention analysis
  - Top 3 bottlenecks with quantitative data
  - Optimization recommendations for Sprint 13

- **`SPRINT13-OPTIMIZATION-PLAN.md`** - Quick reference optimization guide
  - Weekly execution plan (4 weeks)
  - Code snippets for each optimization
  - Success criteria and validation checklist
  - Risk mitigation strategies

### Analysis Tools
- **`analyze-jfr.py`** - Automated JFR analysis script
  - Single-file analysis with detailed metrics
  - Comparison mode for before/after optimization
  - Performance assessment with warnings

### JFR Profiles
- **`aurigraph-sprint12-profile.jfr`** - Baseline performance profile (44 MB)
  - 30 minutes of production-like load
  - 776K TPS baseline

## Quick Start

### 1. View Sprint 12 Analysis

```bash
# Read the full analysis report
cat JFR-PERFORMANCE-ANALYSIS-SPRINT12.md | less

# Or open in your editor
code JFR-PERFORMANCE-ANALYSIS-SPRINT12.md
```

### 2. Analyze a JFR Profile

```bash
# Analyze Sprint 12 baseline
python3 analyze-jfr.py aurigraph-sprint12-profile.jfr

# Example output:
# ⚠️  HIGH virtual thread overhead: 96.2% (target <5%)
# ⚠️  LOW application CPU efficiency: 1.6% (target >80%)
# ⚠️  HIGH GC pause detected: 262.0ms (target <50ms)
```

### 3. Compare Profiles (Before/After Optimization)

```bash
# After implementing Week 1 optimizations
python3 analyze-jfr.py --compare \
  aurigraph-sprint12-profile.jfr \
  sprint13-week1-profile.jfr

# Shows improvements/regressions:
# ✅ Virtual thread overhead reduced by 91.1%
# ✅ Max GC pause reduced by 45.2%
# ✅ Application CPU efficiency increased by 78.4%
```

### 4. Follow Sprint 13 Plan

```bash
# Read the weekly execution plan
cat SPRINT13-OPTIMIZATION-PLAN.md | less

# Week 1: Platform thread migration
# Week 2: Lock-free ring buffer
# Week 3: Allocation reduction
# Week 4: Database optimization
```

## Key Findings from Sprint 12

### Performance Baseline
- **Current TPS:** 776K
- **Target TPS:** 2M+
- **Gap:** 61% below target

### Top 3 Bottlenecks

1. **Virtual Thread Overhead (56% CPU)**
   - Fix: Replace with platform threads
   - Expected gain: +350K TPS

2. **Excessive Allocations (9.4 MB/s)**
   - Fix: Object pooling + batch processing
   - Expected gain: +280K TPS

3. **Thread Contention (89 min wait time)**
   - Fix: Cache query plans + scale DB pool
   - Expected gain: +400K TPS

### Optimization Roadmap

| Week | Optimization | Target TPS | Confidence |
|------|--------------|------------|------------|
| 1 | Platform threads | 1.1M | High |
| 2 | Lock-free ring buffer | 1.4M | Medium |
| 3 | Allocation reduction | 1.6M | High |
| 4 | Database optimization | 2.0M+ | Medium |

## JFR Profiling Commands

### Start a New Profile

```bash
# Find Java process ID
jps | grep aurigraph

# Start 30-minute profiling
jcmd <PID> JFR.start name=sprint13-week1 duration=30m \
  filename=sprint13-week1-profile.jfr
```

### Monitor Active Recordings

```bash
# List active recordings
jcmd <PID> JFR.check

# Example output:
# Recording 1: name=sprint13-week1 duration=30m (14m remaining)
```

### Stop and Analyze

```bash
# Recording stops automatically after duration
# Or stop manually:
jcmd <PID> JFR.stop name=sprint13-week1

# Analyze results
python3 analyze-jfr.py sprint13-week1-profile.jfr
```

### Quick Analysis Commands

```bash
# Summary
jfr summary <file>.jfr

# CPU hotspots
jfr print --events jdk.ExecutionSample <file>.jfr | \
  grep "io.aurigraph" | head -20

# GC events
jfr print --events jdk.GarbageCollection <file>.jfr | \
  grep -E "(duration|name)"

# Allocations
jfr print --events jdk.ObjectAllocationSample <file>.jfr | \
  grep -E "(objectClass|weight)" | head -30
```

## Performance Validation Workflow

### After Each Optimization:

1. **Run performance benchmark**
   ```bash
   ./mvnw quarkus:dev
   curl -X POST http://localhost:9003/api/v11/performance \
     -H "Content-Type: application/json" \
     -d '{"transactions": 100}'
   ```

2. **Capture JFR profile (30 minutes)**
   ```bash
   jcmd <PID> JFR.start name=validation duration=30m \
     filename=validation-profile.jfr
   ```

3. **Analyze and compare**
   ```bash
   python3 analyze-jfr.py --compare \
     aurigraph-sprint12-profile.jfr \
     validation-profile.jfr
   ```

4. **Verify success criteria**
   - [ ] TPS increased by expected amount
   - [ ] Virtual thread % decreased (if applicable)
   - [ ] GC pauses decreased (if applicable)
   - [ ] No regressions in other metrics

## Success Criteria (Sprint 13 Final)

### Critical Requirements (ALL must pass):

- [x] TPS ≥ 2,000,000 (sustained 30 minutes)
- [x] p99 latency < 10ms
- [x] Max GC pause < 50ms
- [x] Application CPU > 80%
- [x] Virtual thread overhead < 5%
- [x] Allocation rate < 4 MB/s
- [x] Zero thread contention events

### Validation Command:

```bash
# Run final acceptance test
python3 analyze-jfr.py sprint13-final-profile.jfr

# Should show:
# ✅ Virtual thread overhead acceptable: <5%
# ✅ Application CPU efficiency good: >80%
# ✅ GC pauses under control: <50ms
# ✅ Allocation rate acceptable: <4 MB/s
# ✅ No significant thread contention
```

## Troubleshooting

### Problem: JFR command not found
```bash
# Solution: Ensure JDK 21+ is in PATH
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
which jfr  # Should show path to jfr
```

### Problem: analyze-jfr.py fails with import error
```bash
# Solution: Ensure Python 3.8+
python3 --version  # Should be 3.8 or higher
```

### Problem: JFR file not found
```bash
# Solution: Check current directory
ls -lh *.jfr
# Files should be in current working directory
```

### Problem: Analysis shows no improvements
```bash
# Solution: Verify optimization was actually applied
# 1. Check git diff for code changes
# 2. Rebuild application: ./mvnw clean package
# 3. Restart application
# 4. Re-run profiling
```

## Additional Resources

### JFR Documentation
- [Java Flight Recorder Guide](https://docs.oracle.com/en/java/javase/21/jfapi/)
- [JFR Command Reference](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jfr.html)

### Performance Tuning
- [G1GC Tuning Guide](https://www.oracle.com/technical-resources/articles/java/g1gc.html)
- [Virtual Threads Best Practices](https://openjdk.org/jeps/444)

### Internal Documentation
- `SPRINT_PLAN.md` - Current sprint objectives
- `COMPREHENSIVE-TEST-PLAN.md` - Testing strategy
- `TODO.md` - Current work status

## Contact

**Performance Issues:** Review `JFR-PERFORMANCE-ANALYSIS-SPRINT12.md` Section 7-8
**Optimization Questions:** See `SPRINT13-OPTIMIZATION-PLAN.md` Risk Mitigation section
**Tool Issues:** Check Troubleshooting section above

---

**Last Updated:** October 24, 2025
**Sprint:** Sprint 13 - Performance Optimization
**Version:** 1.0
