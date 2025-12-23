# Native Build Fix - Immediate Actions

## Problem
Native build FAILED with: `Error: In user 'G1' is not a valid value for the option --gc. Supported values are 'epsilon', 'serial'.`

## Root Cause
G1 Garbage Collector is NOT supported by Mandrel/GraalVM native images. Must use `serial` or `epsilon`.

## Required Fixes (3 Files)

### Fix 1: pom.xml - Line 888 (native profile)
```xml
<!-- REMOVE these lines -->
-H:+UseG1GC,
-H:MaxGCPauseMillis=1,
-H:G1HeapRegionSize=32m,
```

### Fix 2: pom.xml - Line 991 (native-ultra profile)
```xml
<!-- REMOVE these lines -->
-H:+UseG1GC,
-H:MaxGCPauseMillis=1,
-H:G1HeapRegionSize=64m,
```

### Fix 3: src/main/resources/application-prod.properties
```properties
# CHANGE FROM:
quarkus.native.additional-build-args=--gc=G1,--optimize=2,-march=native,-H:+UnlockExperimentalVMOptions,-H:+UseG1GC,-H:+UseLargePages

# CHANGE TO:
quarkus.native.additional-build-args=--gc=serial,--optimize=2,-march=native,-H:+UnlockExperimentalVMOptions,-H:+UseLargePages
```

## Validation Command
```bash
# After fixes, test with fast profile first
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean package -Pnative-fast
```

## Expected Result
- Build should succeed in ~5-10 minutes
- Native executable created: `target/aurigraph-v11-standalone-*-runner`
- Can proceed to full `native-ultra` build

## Timeline
- **Fix application**: 15 minutes
- **Fast build test**: 10 minutes
- **Full production build**: 90 minutes
- **Total**: ~2 hours to production-ready native executable

---

**Status**: Ready for implementation
**Priority**: CRITICAL
**Next**: Apply fixes and rerun build
