# Native Compilation Blocker - Sprint 11

**Date**: October 21, 2025
**Sprint**: Sprint 11 - Performance Optimization
**Priority**: Priority 1 blocker

---

## Issue Summary

Native compilation with GraalVM failed due to configuration error in native-image.properties.

## Error Details

```
Error: Processing jar:file:///path/to/aurigraph-v11-standalone-11.3.4-native-image-source-jar/aurigraph-v11-standalone-11.3.4-runner.jar!/META-INF/native-image/native-image.properties failed

Caused by: com.oracle.svm.driver.NativeImage$NativeImageError: Using '--verbose' provided by 'META-INF/native-image/native-image.properties' in 'file:///path/to/aurigraph-v11-standalone-11.3.4-runner.jar' is only allowed on command line.
```

**Build Command**: `./mvnw clean package -Pnative -DskipTests -Dquarkus.native.container-build=false`
**Build Time**: 24.591s (failed before native image generation)
**Exit Code**: 20

## Root Cause

The `--verbose` flag is included in `META-INF/native-image/native-image.properties` within the generated JAR, but GraalVM native-image only allows this flag on the command line, not in property files.

## Environment

- **GraalVM**: 21 2023-09-19 (Oracle GraalVM 21+35.1)
- **Quarkus**: 3.28.2
- **Java**: 21 (JVMCI 23.1-b15)
- **OS**: macOS Darwin 24.6.0
- **Native Image Tool**: /Users/subbujois/.sdkman/candidates/java/21-graal/bin/native-image

## Impact

- **Priority 1** native compilation path is blocked
- Expected 20-30% TPS improvement from native compilation is unavailable
- Alternative optimizations (Phase 3C, profiling) remain viable

## Investigation Required

1. **Check pom.xml native profiles**:
   - `-Pnative`
   - `-Pnative-fast`
   - `-Pnative-ultra`

2. **Review native-image configuration**:
   - `src/main/resources/META-INF/native-image/`
   - Look for `native-image.properties` generation

3. **Quarkus native build configuration**:
   - `quarkus.native.*` properties in `application.properties`
   - Check if `--verbose` is being added automatically

## Potential Solutions

### Option A: Remove --verbose from native-image.properties
```xml
<!-- In pom.xml or native profile -->
<quarkus.native.additional-build-args>
  <!-- Remove or relocate --verbose flag -->
</quarkus.native.additional-build-args>
```

### Option B: Use command-line override
```bash
# Pass --verbose on command line instead of properties file
./mvnw package -Pnative -Dquarkus.native.enable-verbose=true
```

### Option C: Suppress verbose in properties
```properties
# In application.properties
quarkus.native.enable-verbose=false
```

## Workaround

For Sprint 11, proceed with Phase 3C conservative JVM tuning and real-world profiling instead of native compilation. Native compilation can be addressed in Sprint 12 after investigation.

## References

- GraalVM Native Image docs: https://www.graalvm.org/latest/reference-manual/native-image/
- Quarkus Native Guide: https://quarkus.io/guides/building-native-image
- Build log: `/tmp/native-production-build.log`

---

**Status**: Blocked - requires pom.xml/configuration investigation
**Next Steps**: Proceed with Priority 2 (Phase 3C) and Priority 3 (profiling)
