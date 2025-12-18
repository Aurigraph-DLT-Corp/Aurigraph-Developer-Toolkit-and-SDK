# SPARC Plan: Demo API Consolidation & In-Memory Persistence

## Situation
Currently, the Aurigraph platform has **two separate demo APIs**:
- `/api/v11/demos` (DemoResource.java) - Database-backed via Hibernate Panache
- `/api/v12/demos` (FilesystemDemoResource.java) - Filesystem-backed

Both have persistence issues:
- V11: Database permission issues cause transaction rollbacks
- V12: No volume mount means data is lost on container restart

Frontend uses local storage fallback, masking backend issues.

## Problem
1. **Duplicate Code**: Two APIs doing the same thing
2. **No Reliable Persistence**: Demos don't survive container restarts
3. **Complex Configuration**: Database permissions, volume mounts required
4. **Maintenance Burden**: Two codepaths to maintain

## Action Plan

### Sprint Tasks (Estimated: 2 hours)

| Task | Description | Status |
|------|-------------|--------|
| 1 | Create unified `DemoService` with in-memory cache + TTL | Pending |
| 2 | Implement Redis-backed persistence (24-hour TTL) | Pending |
| 3 | Consolidate to single `/api/v11/demos` endpoint | Pending |
| 4 | Remove FilesystemDemoResource and FilesystemDemoRepository | Pending |
| 5 | Update DemoResource to use new service | Pending |
| 6 | Add scheduled cleanup for expired demos | Pending |
| 7 | Deploy and verify | Pending |

### Architecture Decision
**Use Redis** for 24-hour in-memory persistence:
- Already running on remote server (`dlt-redis` container)
- Built-in TTL support (EXPIRE command)
- Fast reads/writes
- Survives application restarts
- Quarkus has native Redis support

### Implementation Details

#### New Components:
1. `RedisDemoService.java` - Unified demo service with Redis backend
2. Update `DemoResource.java` - Use RedisDemoService instead of Panache
3. Delete `FilesystemDemoResource.java` and `FilesystemDemoRepository.java`

#### Configuration:
```properties
# Redis Demo Cache Configuration
quarkus.redis.hosts=redis://dlt-redis:6379
aurigraph.demo.ttl-hours=24
aurigraph.demo.cache-prefix=demo:
```

## Result (Expected)
- Single unified API at `/api/v11/demos`
- Demos persist for 24 hours automatically
- No database permission issues
- No filesystem mount requirements
- Simplified codebase

## Consequence
- Cleaner architecture
- Reliable demo experience
- Reduced operational complexity
- Better user experience (demos survive restarts)

---

## Execution Log

### Task 1: Create RedisDemoService
Status: Starting...
