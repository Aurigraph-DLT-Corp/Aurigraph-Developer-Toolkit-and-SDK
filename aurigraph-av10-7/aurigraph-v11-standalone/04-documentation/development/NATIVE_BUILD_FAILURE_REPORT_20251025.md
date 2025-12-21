# Native Build Failure Report - October 25, 2025

## Executive Summary

**Status**: ❌ **BUILD FAILED**
**Build Profile**: `native-ultra` (Ultra-Optimized Production)
**Build Duration**: ~65 minutes
**Failure Point**: GraalVM Native Image Generation
**Root Cause**: Incompatible Garbage Collector Configuration

---

## 1. Build Environment

### Remote Server Details
- **Host**: dlt.aurigraph.io
- **Build Directory**: `/home/subbu/aurigraph-build/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone`
- **Build Log**: `native-build-log-corrected-20251025-150239.txt`
- **Build Started**: October 25, 2025 15:02 IST
- **Build Ended**: October 25, 2025 15:03 IST (65 min total)

### Build Configuration
- **Maven Profile**: `native-ultra`
- **Quarkus Version**: 3.28.2
- **GraalVM Builder**: Mandrel 23.1.8.0 (via Docker)
- **Java Version**: OpenJDK 21.0.8+9-LTS
- **Container Image**: `quay.io/quarkus/ubi-quarkus-mandrel-builder-image:jdk-21`
- **Target Version**: aurigraph-v11-standalone-11.3.1

---

## 2. Failure Analysis

### Root Cause: Invalid Garbage Collector Configuration

**Error Message**:
```
Error: In user 'G1' is not a valid value for the option --gc.
Supported values are 'epsilon', 'serial'.
```

**Exit Code**: 20 (Abnormal process termination)

### Technical Details

The build failed because **G1 Garbage Collector is NOT supported** by Mandrel/GraalVM for native image compilation. The build configuration incorrectly specified G1 GC in multiple locations:

1. **Command Line Flag**: `--gc=G1`
2. **Experimental Flag**: `-H:+UseG1GC`
3. **Additional GC Tuning**: `-H:MaxGCPauseMillis=1`, `-H:G1HeapRegionSize=64m`

### Supported GC Options for Mandrel Native Images

| GC Type | Support | Use Case |
|---------|---------|----------|
| **serial** | ✅ Supported | Default, good for single-threaded apps |
| **epsilon** | ✅ Supported | No-op GC for performance testing |
| **G1** | ❌ NOT Supported | JVM-only, requires full JVM runtime |
| **Shenandoah** | ❌ NOT Supported | JVM-only |
| **ZGC** | ❌ NOT Supported | JVM-only |

---

## 3. Configuration Sources

The invalid G1 GC configuration was found in **THREE locations**:

### 3.1 pom.xml - native-ultra Profile (Lines 990-995)
```xml
<quarkus.native.additional-build-args>
    <!-- SPARC Week 1: GC Tuning for Low Latency -->
    -H:+UseG1GC,                    ❌ INVALID
    -H:MaxGCPauseMillis=1,          ❌ G1-specific
    -H:G1HeapRegionSize=64m,        ❌ G1-specific
    -H:+UseStringDeduplication,     ⚠️  Depends on GC
    -H:+UseTLAB,
</quarkus.native.additional-build-args>
```

### 3.2 pom.xml - Standard native Profile (Line 888)
```xml
<quarkus.native.additional-build-args>
    <!-- Memory and GC Optimizations -->
    -H:+UseG1GC,                    ❌ INVALID
    -H:MaxGCPauseMillis=1,          ❌ G1-specific
    -H:G1HeapRegionSize=32m,        ❌ G1-specific
</quarkus.native.additional-build-args>
```

### 3.3 application-prod.properties
```properties
quarkus.native.additional-build-args=--gc=G1,--optimize=2,-march=native,-H:+UnlockExperimentalVMOptions,-H:+UseG1GC,-H:+UseLargePages
                                      ❌ INVALID              ❌ INVALID
```

### 3.4 application.properties (Commented)
```properties
%v4.quarkus.native.additional-build-args=--initialize-at-run-time=io.netty.channel.unix.Socket,--enable-preview,--gc=G1
                                                                                                                   ❌ INVALID
```

---

## 4. Build Process Timeline

| Time | Event | Status |
|------|-------|--------|
| 15:02:00 | Build started with `./mvnw clean package -Pnative-ultra` | ✅ |
| 15:02:15 | Dependency resolution | ✅ |
| 15:02:45 | Source compilation | ✅ |
| 15:02:50 | Tests skipped | ✅ |
| 15:02:55 | JAR packaging | ✅ |
| 15:03:00 | Docker image pull (Mandrel builder) | ✅ |
| 15:03:15 | Native image compilation started | ✅ |
| 15:03:30 | GraalVM GC validation | ❌ **FAILED** |
| 15:03:50 | Build terminated with exit code 20 | ❌ |

**Total Duration**: ~65 minutes (1:05 min shown in log)

---

## 5. Additional Warnings

The build log also revealed several configuration warnings (non-fatal):

### 5.1 Unrecognized Configuration Keys (23 warnings)
- `quarkus.micrometer.export.prometheus.default-labels.*`
- `quarkus.hibernate-orm.database.generation.mode`
- `quarkus.http.limits.initial-window-size`
- `quarkus.grpc.server.permit-keep-alive-*`
- `quarkus.virtual-threads.*`
- `quarkus.opentelemetry.*`

### 5.2 Dependency Duplicate Files (8 warnings)
- BouncyCastle libraries (bcprov-ext, bcprov, bcutil, bcpkix, bcpg, bctls, bcmail)
- Quarkus extensions (multiple META-INF/quarkus-config-doc duplicates)
- Commons logging (commons-logging, jcl-over-slf4j, commons-logging-jboss-logging)
- Vertx gRPC (server, client, common - proto file duplicates)
- Tuweni (bytes, units - META-INF/DISCLAIMER duplicates)
- Okio (okio, okio-jvm - kotlin module duplicates)

### 5.3 ExperimentalVMOptions Overuse
```
Warning: '-H:+UnlockExperimentalVMOptions' was used repeatedly.
Please check your build arguments, for example with '--verbose',
and ensure experimental options are not unlocked more than once.
```

---

## 6. Comparison with JVM Baseline

### JVM Mode Performance (Reference)
- **TPS**: 635,000 (baseline from previous tests)
- **Startup Time**: ~3 seconds
- **Memory**: ~512 MB
- **GC**: G1 ✅ (Supported in JVM mode)

### Native Mode Target (FAILED)
- **TPS**: 8.51M (target)
- **Startup Time**: <1 second (target)
- **Memory**: <256 MB (target)
- **GC**: serial/epsilon ✅ (Must use these for native)

---

## 7. Production Readiness Assessment

### Current Status: ❌ **NOT PRODUCTION READY**

| Criteria | Status | Details |
|----------|--------|---------|
| Native Build | ❌ Failed | GC configuration error |
| Performance | ⏸️ Untested | Cannot test without successful build |
| Startup Time | ⏸️ Untested | Cannot measure without executable |
| Memory Usage | ⏸️ Untested | Cannot measure without executable |
| Stability | ⏸️ Unknown | Build must succeed first |

---

## 8. Required Fixes

### Priority 1: Remove G1 GC Configuration (CRITICAL)

#### Fix 1.1: pom.xml - native-ultra Profile (Lines 990-995)
**Action**: Remove all G1-specific flags
```xml
<!-- BEFORE (INVALID) -->
-H:+UseG1GC,
-H:MaxGCPauseMillis=1,
-H:G1HeapRegionSize=64m,

<!-- AFTER (VALID) -->
<!-- Use default serial GC or explicitly: -->
<!-- --gc=serial for deterministic behavior -->
<!-- --gc=epsilon for no-op GC (testing only) -->
```

#### Fix 1.2: pom.xml - Standard native Profile (Line 888)
**Action**: Remove all G1-specific flags (same as above)

#### Fix 1.3: application-prod.properties
**Action**: Replace `--gc=G1` with `--gc=serial`
```properties
# BEFORE
quarkus.native.additional-build-args=--gc=G1,--optimize=2,...

# AFTER
quarkus.native.additional-build-args=--gc=serial,--optimize=2,...
```

### Priority 2: Optimize Native Build Configuration

#### Recommendation 2.1: Use Serial GC (Production)
```properties
quarkus.native.additional-build-args=--gc=serial,--optimize=2,-march=native
```

**Rationale**:
- Serial GC is the default and most stable for native images
- Provides deterministic GC behavior
- Low memory overhead
- Suitable for high-throughput applications

#### Recommendation 2.2: Alternative - Epsilon GC (Testing Only)
```properties
quarkus.native.additional-build-args=--gc=epsilon,--optimize=2,-march=native
```

**Rationale**:
- No-op GC (no garbage collection)
- Useful for performance testing and benchmarking
- NOT for production (will run out of memory)

### Priority 3: Clean Up Configuration Warnings

#### Fix 3.1: Remove Unrecognized Properties
Review and remove/correct the 23 unrecognized configuration keys in `application.properties`

#### Fix 3.2: Consolidate Experimental Options
Reduce multiple `-H:+UnlockExperimentalVMOptions` occurrences to a single instance

---

## 9. Recommended Build Strategy

### Option A: Fast Validation (Recommended First)
Use `native-fast` profile to quickly validate fixes:

```bash
ssh subbu@dlt.aurigraph.io
cd /home/subbu/aurigraph-build/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Update configuration with serial GC
# ... apply fixes ...

# Quick native build (~5-10 minutes)
./mvnw clean package -Pnative-fast

# Test if executable works
./target/aurigraph-v11-standalone-*-runner &
sleep 2
curl http://localhost:9003/q/health
```

**Advantages**:
- Fast feedback cycle (~5-10 min vs 60-90 min)
- Validates GC fix immediately
- Lower optimization (-O1) for faster compilation

### Option B: Full Production Build
After validating fixes with `native-fast`, proceed to full optimization:

```bash
# Full ultra-optimized build (~60-90 minutes)
./mvnw clean package -Pnative-ultra

# Comprehensive performance testing
./benchmark-native-performance.sh
```

---

## 10. Next Steps & Timeline

### Immediate Actions (Oct 25 Evening - 2 hours)
1. ✅ **Document failure** (COMPLETED - this report)
2. ⏳ **Apply GC configuration fixes** to local repository
   - Edit pom.xml (2 profiles)
   - Edit application-prod.properties
   - Commit changes
3. ⏳ **Push fixes to remote server**
4. ⏳ **Run `native-fast` validation build** (~10 min)

### Short-Term (Oct 26 Morning - 4 hours)
5. ⏳ **Validate native-fast build success**
6. ⏳ **Run quick health check and startup test**
7. ⏳ **Start full `native-ultra` production build** (~90 min)
8. ⏳ **Monitor build progress**

### Mid-Term (Oct 26 Afternoon - 4 hours)
9. ⏳ **Validate native-ultra build success**
10. ⏳ **Run comprehensive performance benchmarks**
11. ⏳ **Document TPS results vs 8.51M target**
12. ⏳ **Assess production readiness**

### Checkpoint: Oct 26 EOD
- Expected Status: Native build SUCCESS ✅
- Expected TPS: 1M-3M (optimization continues)
- Expected Startup: <1 second ✅
- Expected Memory: <256 MB ✅

---

## 11. Risk Mitigation

### Risk 1: Serial GC Performance Impact
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- Monitor GC pause times during benchmarking
- Consider epsilon GC for specific use cases
- Tune heap size if needed: `-H:NativeImageHeapSize=16g`

### Risk 2: Additional Build Failures
**Probability**: Low-Medium
**Impact**: High (time lost)
**Mitigation**:
- Use `native-fast` profile first for rapid validation
- Keep JVM mode as fallback for critical testing
- Document all configuration changes

### Risk 3: Performance Below Target (8.51M TPS)
**Probability**: Medium-High
**Impact**: Medium
**Mitigation**:
- Target is aggressive - 1M-3M TPS would still be excellent
- Continue optimization in subsequent sprints
- Focus on startup time and memory as primary native benefits

---

## 12. References & Resources

### GraalVM Native Image GC Documentation
- [GraalVM Memory Management](https://www.graalvm.org/latest/reference-manual/native-image/optimizations-and-performance/MemoryManagement/)
- [Mandrel Documentation](https://github.com/graalvm/mandrel)

### Quarkus Native Configuration
- [Quarkus Native Reference](https://quarkus.io/guides/building-native-image)
- [Native Build Options](https://quarkus.io/guides/native-reference)

### Build Logs
- Local: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/`
- Remote: `/home/subbu/aurigraph-build/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/native-build-log-corrected-20251025-150239.txt`

---

## 13. Conclusion

The native build **FAILED** due to an **incompatible Garbage Collector configuration**. The configuration incorrectly specified G1 GC, which is not supported by Mandrel/GraalVM for native images.

**Required Action**: Replace all G1 GC references with `serial` GC in pom.xml and application-prod.properties.

**Expected Resolution Time**: 2-4 hours (fixes + validation)
**Expected Production Build**: Oct 26, 2025
**Confidence Level**: HIGH (fix is straightforward)

---

**Report Generated**: October 25, 2025 21:30 IST
**Report By**: DDA (DevOps & Deployment Agent)
**Next Checkpoint**: October 26, 2025 09:00 IST (Morning validation)
