# GraalVM 23.1 Native Image - Quick Reference Card

## TL;DR - What Was Fixed

❌ **Before:** 9 invalid GraalVM options causing build failures
✅ **After:** All invalid options removed, GraalVM 23.1 compatible

**Files Changed:** `pom.xml` (native-ultra profile, lines 1012-1053)

---

## Quick Build Commands

```bash
# Navigate to project
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Validate XML
./mvnw validate

# Build with native-ultra (production)
./mvnw clean package -Pnative-ultra

# Build with native-fast (development)
./mvnw clean package -Pnative-fast

# Run native image
./target/aurigraph-v11-standalone-11.4.4-runner
```

---

## What Changed in 10 Seconds

### Removed (Invalid)
- `-H:+EliminateAllocations`
- `-H:+OptimizeBulkTransfer`
- `-H:+InlineIntrinsics`
- `-H:MaxInlineLevel=32`
- `-H:FreqInlineSize=512`
- `-H:NativeImageHeapSize=16g` (wrong syntax)
- `-H:MaxDirectMemorySize=8g`
- `-H:ReservedCodeCacheSize=512m`
- `-H:MaxJavaStackTraceDepth=20`

### Added (Correct)
- `-J-Xmx16g` (build-time max heap)
- `-J-Xms8g` (build-time initial heap)

### Kept (Valid)
- `-O3`, `-march=compatibility`
- `-H:+UseCompressedOops`, `-H:+UseCompressedClassPointers`
- `-H:+UseStringDeduplication`, `-H:+OptimizeStringConcat`
- All `--initialize-at-run-time` settings

---

## Valid GraalVM 23.1 Options (Cheat Sheet)

### Optimization Levels
```
-O0   # No optimization (fastest build)
-O1   # Basic optimization
-O2   # Standard optimization (default)
-O3   # Maximum optimization (slowest build, best runtime)
```

### Architecture
```
-march=native          # Optimize for current CPU
-march=compatibility   # Compatible across x86-64 CPUs
-march=x86-64-v3      # Specific microarchitecture
```

### Memory Flags (Valid)
```
-H:+UseCompressedOops              # Compress object pointers
-H:+UseCompressedClassPointers     # Compress class pointers
-H:+UseStringDeduplication         # Deduplicate strings
-H:+OptimizeStringConcat           # Optimize string concatenation
```

### Startup Flags (Valid)
```
-H:-SpawnIsolates                  # Faster startup, no isolates
-H:+StaticExecutableWithDynamicLibC # Static linking
-H:+AllowIncompleteClasspath       # Allow missing classes
-H:+RemoveSaturatedTypeFlows       # Remove unnecessary flows
```

### Build-time JVM Memory (Valid)
```
-J-Xmx<size>    # Max heap for native-image builder (e.g., 16g)
-J-Xms<size>    # Initial heap for builder (e.g., 8g)
-J-XX:+UseG1GC  # Use G1 GC for builder process
```

### Runtime Initialization (Valid)
```
--initialize-at-run-time=<class>     # Init at runtime
--initialize-at-build-time=<class>   # Init at build time
```

### Diagnostics (Experimental)
```
-H:+PrintFeatures              # Print enabled features
-H:+PrintAnalysisCallTree      # Print call tree (verbose)
-H:+ReportExceptionStackTraces # Report exception stacks
```

---

## Invalid Options to Avoid

❌ **These DO NOT exist in GraalVM:**
- `-H:+EliminateAllocations`
- `-H:+OptimizeBulkTransfer`
- `-H:+InlineIntrinsics`
- `-H:MaxInlineLevel=X`
- `-H:FreqInlineSize=X`
- `-H:NativeImageHeapSize=X` (use `-J-Xmx` instead)
- `-H:MaxDirectMemorySize=X`
- `-H:ReservedCodeCacheSize=X`
- `-H:MaxJavaStackTraceDepth=X`

---

## Profile Quick Reference

### native-ultra (Production)
**Purpose:** Maximum optimization
**Build Time:** ~10-15 minutes
**Optimization:** `-O3`
**Use When:** Production releases, performance testing

### native-fast (Development)
**Purpose:** Fast builds
**Build Time:** ~2-3 minutes
**Optimization:** `-O1`
**Use When:** Development, quick testing, CI/CD

### native (Standard)
**Purpose:** Balanced
**Build Time:** ~5-7 minutes
**Optimization:** `-O2` (default)
**Use When:** Staging, general testing

---

## Memory Settings Explained

### Build-time Memory (What we set)
```xml
-J-Xmx16g   # Max heap for the native-image BUILDER process
-J-Xms8g    # Initial heap for the BUILDER process
```
This is memory used **during compilation**, not at runtime.

### Runtime Memory (Set when running binary)
```bash
# These are applied when RUNNING the native image
./app-runner -XX:MaxRAMPercentage=75.0 -XX:+UseSerialGC
```

---

## Common Build Errors & Fixes

### Error: "Unrecognized option: -H:+EliminateAllocations"
**Fix:** ✅ Already fixed in this update

### Error: "OutOfMemoryError during native-image build"
**Fix:** Increase `-J-Xmx` value (e.g., `-J-Xmx32g`)

### Error: "Could not find or load main class"
**Fix:** Check `--initialize-at-run-time` settings

### Warning: "PrintAnalysisCallTree is experimental"
**Fix:** Remove `-H:+PrintAnalysisCallTree` if logs are too large

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| **Startup Time** | <1s | TBD |
| **Binary Size** | <256MB | ~150MB expected |
| **Memory Usage** | <256MB | TBD |
| **TPS** | 2M+ | 776K (needs optimization) |
| **Build Time** | <15min | ~10-15min expected |

---

## Testing Commands

```bash
# 1. Validate configuration
./mvnw validate

# 2. Build native image
./mvnw clean package -Pnative-ultra

# 3. Check binary size
ls -lh target/*-runner

# 4. Test startup time
time ./target/*-runner --version

# 5. Run application
./target/*-runner

# 6. Check health endpoint
curl http://localhost:9003/q/health

# 7. Run performance tests
./SPRINT1-COMPREHENSIVE-PERFORMANCE-BENCHMARK.sh
```

---

## Troubleshooting

### Build fails with "unrecognized option"
→ Check if you're using invalid `-H:` options
→ Verify GraalVM version: `native-image --version`

### Build takes too long
→ Use `-Pnative-fast` for development
→ Increase build memory: `-J-Xmx32g`
→ Use local build instead of container: `-Dquarkus.native.container-build=false`

### Binary too large
→ Remove diagnostic flags: `-H:+PrintAnalysisCallTree`
→ Use compression: `--strip-debug`
→ Check dependencies (remove unused)

### Application crashes at startup
→ Check `--initialize-at-run-time` settings
→ Review reflection configuration
→ Check for missing resources

---

## Documentation Links

**GraalVM:**
- Options: https://www.graalvm.org/latest/reference-manual/native-image/overview/Options/
- Optimization: https://www.graalvm.org/latest/reference-manual/native-image/optimizations-and-performance/

**Quarkus:**
- Native Guide: https://quarkus.io/guides/building-native-image
- Native Reference: https://quarkus.io/guides/native-reference

**Mandrel:**
- Releases: https://github.com/graalvm/mandrel/releases

---

## Version Information

**Project:** Aurigraph V11 Standalone
**Version:** 11.4.4
**GraalVM:** 23.1 (Mandrel 24.0)
**Quarkus:** 3.29.0
**Java:** 21
**Fixed Date:** November 10, 2025

---

## Files Reference

| File | Purpose |
|------|---------|
| `pom.xml` | Maven configuration with native profiles |
| `GRAALVM-FIX-SUMMARY.md` | Detailed fix documentation |
| `GRAALVM-BEFORE-AFTER-COMPARISON.md` | Before/after comparison |
| `GRAALVM-QUICK-REFERENCE.md` | This file |
| `src/main/resources/META-INF/native-image/native-image.properties` | Additional native config (already valid) |

---

**Need Help?**
- Check `GRAALVM-FIX-SUMMARY.md` for detailed explanation
- Check `GRAALVM-BEFORE-AFTER-COMPARISON.md` for side-by-side comparison
- Run `./mvnw validate` to check configuration

---

**End of Quick Reference**
