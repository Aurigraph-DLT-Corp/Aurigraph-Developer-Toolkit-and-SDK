# Sprint 12 Priority 1 Findings - Native Compilation Investigation

**Date**: October 21, 2025
**Sprint**: Sprint 12 - Incremental Optimization
**Priority**: Priority 1 - Native Compilation Blocker Resolution
**Status**: Primary Blocker RESOLVED, Secondary Issues Identified

---

## Executive Summary

**✅ PRIMARY BLOCKER RESOLVED**: The Sprint 11 `--verbose` blocker has been successfully fixed.

**⚠️ SECONDARY ISSUES DISCOVERED**: Additional GraalVM 23.1 / Quarkus 3.28.2 compatibility issues prevent full native compilation.

**RECOMMENDATION**: Proceed with Priority 2 (Phase 3C JVM testing) and Priority 3 (Profiling). Defer native compilation to Sprint 13 after Quarkus/GraalVM version alignment.

---

## Primary Blocker Resolution

### Sprint 11 Error
```
Error: Using '--verbose' provided by 'META-INF/native-image/native-image.properties'
in 'file:///path/to/aurigraph-v11-standalone-11.3.4-runner.jar' is only allowed on command line.
Exit Code: 20
```

### Root Cause
The `--verbose` flag was present in line 116 of `src/main/resources/META-INF/native-image/native-image.properties`. GraalVM native-image only allows this flag on the command line, not in property files.

### Fix Applied
**File**: `src/main/resources/META-INF/native-image/native-image.properties:116`

**Before**:
```properties
       -H:NativeLinkerOption=-static-libgcc \
       -H:NativeLinkerOption=-static-libstdc++ \
       -H:+DumpTargetInfo \
       --verbose
```

**After**:
```properties
       -H:NativeLinkerOption=-static-libgcc \
       -H:NativeLinkerOption=-static-libstdc++ \
       -H:+DumpTargetInfo
```

**Result**: `--verbose` error no longer occurs ✅

---

## Secondary Issues Discovered

### Issue 1: `--optimize` Flag Incompatibility
**Error**: `Error: Unrecognized option(s): '--optimize=2'`

**Cause**: Quarkus 3.28.2 generates `--optimize=2` flag which is not recognized by GraalVM 23.1. This version of GraalVM expects `-O2` (capital O) syntax instead.

**Source**: Quarkus native image defaults, not from our configuration.

**Impact**: Prevents native build completion even with `--verbose` fix applied.

### Issue 2: Boolean Option Format Error
**Error**: `VMError$HostedError: Boolean option value can be only + or -`

**Cause**: Some GraalVM options in native-image.properties or pom.xml profiles use incorrect format for boolean flags.

**Examples**:
- Correct: `-H:+UnlockExperimentalVMOptions` (using +)
- Incorrect: `-H:UnlockExperimentalVMOptions` (missing +/-)

**Impact**: Build fails during image heap analysis phase.

---

## Build Attempts Summary

| Attempt | Configuration | Primary Error | Status |
|---------|--------------|---------------|--------|
| **1** | Standard `-Pnative` | `--verbose` not allowed | ❌ Failed (Sprint 11 blocker) |
| **2** | Post-fix `-Pnative-fast` | `--optimize=2` unrecognized | ❌ Failed (Quarkus issue) |
| **3** | Disabled properties | `--optimize=2` unrecognized | ❌ Failed (Quarkus issue) |
| **4** | Custom `-O0` args | Boolean format error | ❌ Failed (config syntax) |

---

## Analysis & Recommendations

### What Worked ✅
1. **`--verbose` fix is correct** - The primary Sprint 11 blocker is resolved
2. **Investigation methodology** - Systematic isolation of issues
3. **Documentation** - All findings captured for future reference

### Remaining Challenges ⚠️
1. **Quarkus/GraalVM Version Mismatch**: Quarkus 3.28.2 defaults don't align with GraalVM 23.1 syntax
2. **Complex native-image.properties**: 116 lines of optimization flags may need simplification
3. **Profile Configuration**: Three native profiles (`-Pnative`, `-Pnative-fast`, `-Pnative-ultra`) with overlapping/conflicting settings

### Recommended Path Forward

#### Option A: Upgrade GraalVM (Recommended) ⭐
**Action**: Upgrade to GraalVM 23.2+ or 24.x which better aligns with Quarkus 3.28.2

**Steps**:
```bash
sdk install java 24-graal
sdk use java 24-graal
./mvnw clean package -Pnative -DskipTests
```

**Expected Outcome**: `--optimize=2` syntax likely supported in newer GraalVM versions

**Risk**: Low (newer versions typically more compatible)

**Effort**: 1-2 hours (version install + rebuild)

#### Option B: Downgrade Quarkus
**Action**: Use Quarkus 3.2x (earlier version) that matches GraalVM 23.1 capabilities

**Risk**: Medium (may lose features/fixes from 3.28.2)

**Effort**: 1-2 days (dependency conflicts, testing)

#### Option C: Simplify native-image.properties
**Action**: Create minimal native-image.properties with only essential flags

**Risk**: Low (can always restore aggressive optimizations)

**Effort**: 2-4 hours (identify minimal required flags)

#### Option D: Defer to Sprint 13 (SELECTED)
**Action**: Accept JVM-based deployment for Sprint 12, focus on Phase 3C testing and profiling

**Rationale**:
- Primary blocker is resolved (validation complete)
- JVM performance (1.14M TPS) already production-ready
- Phase 3C testing doesn't require native compilation
- Profiling data will guide Sprint 13 optimizations
- Native compilation can be revisited with proper version alignment

**Effort**: 0 (continue Sprint 12 as planned)

---

## Sprint 12 Pivot

### Completed: Priority 1 Investigation ✅
- [x] Identified `--verbose` blocker root cause
- [x] Fixed `native-image.properties:116`
- [x] Validated fix (no more `--verbose` error)
- [x] Discovered secondary GraalVM/Quarkus compatibility issues
- [x] Documented findings comprehensively

### Next: Priority 2 - Phase 3C Testing 🔄
**Focus**: Test conservative JVM tuning on remote server

**Advantages**:
- Phase 3C JAR already uploaded to remote server
- No native compilation required
- Expected +5-10% TPS improvement (low risk)
- Validates incremental optimization methodology

**Command**:
```bash
ssh subbu@dlt.aurigraph.io
cd /opt/aurigraph-v11
java -XX:+UseG1GC -XX:G1HeapRegionSize=16M \
     -jar aurigraph-v11-standalone-11.3.4-PHASE3C-runner.jar
```

### Next: Priority 3 - JFR Profiling 📊
**Focus**: Real-world profiling for data-driven Sprint 13 planning

**Benefits**:
- Identifies actual bottlenecks vs. theoretical
- Guides native compilation optimization priorities
- 30-minute profiling session with production-like load

---

## Lessons Learned

### Technical Insights
1. **GraalVM Flag Compatibility**: Version-specific syntax matters (`--optimize` vs `-O`)
2. **Property File Restrictions**: Some flags (like `--verbose`) cannot be in properties files
3. **Version Alignment Critical**: Quarkus + GraalVM versions must be aligned
4. **Build Profile Complexity**: Multiple native profiles can create conflicting configurations

### Process Improvements
1. **One Change at a Time**: Isolated `--verbose` fix before tackling secondary issues
2. **Pragmatic Pivoting**: Recognize when to defer vs. forcing through blockers
3. **Documentation First**: Capture findings immediately while context is fresh
4. **Alternative Paths**: JVM testing provides value while native issues are resolved

---

## Files Modified

### src/main/resources/META-INF/native-image/native-image.properties
**Line 116**: Removed `--verbose` flag
**Status**: Fixed and committed

### SPRINT12_PRIORITY1_FINDINGS.md
**Status**: Created - this document

---

## Conclusion

**Sprint 12 Priority 1 STATUS**: ✅ **Primary Objective Achieved**

The original Sprint 11 blocker (`--verbose` configuration error) has been successfully resolved. The fix is simple, correct, and ready for future use when GraalVM/Quarkus versions are properly aligned.

**Secondary compatibility issues** are environmental/configuration challenges that don't invalidate the `--verbose` fix. These can be addressed in Sprint 13 alongside planned infrastructure upgrades.

**Sprint 12 continues** with Priority 2 (Phase 3C JVM testing) and Priority 3 (Profiling), both of which provide significant value independent of native compilation.

---

**Report Author**: Claude Code
**Sprint**: Sprint 12
**Date**: October 21, 2025
**Next Steps**: Proceed to Priority 2 - Phase 3C Testing
