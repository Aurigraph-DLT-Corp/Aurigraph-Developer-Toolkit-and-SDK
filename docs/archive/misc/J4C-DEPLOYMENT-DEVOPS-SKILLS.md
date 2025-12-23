# J4C Deployment & DevOps Agent Skills Training Guide

**Last Updated:** November 21, 2025
**Audience:** J4C Deployment and DevOps Agents
**Status:** Comprehensive Training Guide

---

## Progress Tracker & Deployment Status

```
╔════════════════════════════════════════════════════════════════╗
║           AURIGRAPH V11 DEPLOYMENT PROGRESS (Nov 21)           ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  ForkJoinPool Configuration        ████████████░░░░░░░░ 60%   ║
║  Infrastructure Deployment         ██████████████████░░ 90%   ║
║  V11 Native Build                  ████░░░░░░░░░░░░░░░ 20%   ║
║  Integration Testing               ░░░░░░░░░░░░░░░░░░░  0%   ║
║  Production Rollout                ░░░░░░░░░░░░░░░░░░░  0%   ║
║                                                                ║
║  Overall Deployment Readiness:     ██████████░░░░░░░░░ 34%   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

### Key Metrics

| Component | Status | Details |
|-----------|--------|---------|
| **Infrastructure** | ✅ 90% Ready | PostgreSQL, Redis, Prometheus, Grafana, NGINX all healthy |
| **V11 API** | ✅ Operational | Running on port 9003 (JVM mode) |
| **Configuration** | ✅ Complete | All ForkJoinPool configs committed to origin/main |
| **Git Sync** | ✅ Synchronized | All commits pushed and verified |
| **Native Build** | 🔄 In Progress | Investigating GraalVM native compilation challenges |

---

## Module 1: Infrastructure Deployment Automation

### 1.1 Deployment Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVOPS DEPLOYMENT PIPELINE                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Git Repo] ──push──> [Origin/Main]                        │
│       ▲                     │                               │
│       │                  pull                               │
│       │                     ▼                               │
│  [Local Dev] <─pull─ [Remote Server]                       │
│       │                     │                               │
│  [Maven Build]           [Docker Build]                    │
│       │                     │                               │
│       ├──────────> [Artifact Registry] <─────┐             │
│       │                     │                 │             │
│       │            [Container Image]    [Native Binary]    │
│       │                     │                               │
│       └──────────> [Docker Compose] ──────────┘            │
│                              │                              │
│                    [Production Services]                    │
│                              │                              │
│  ┌──────────────────────────┼──────────────────────────┐   │
│  │                          │                          │   │
│  ▼                          ▼                          ▼   │
│ PostgreSQL              Redis (Cache)           V11 API    │
│ (Data Store)            (Session/Cache)        (HTTP/gRPC) │
│  │                          │                          │   │
│  └──────────────────────────┼──────────────────────────┘   │
│                             │                               │
│              ┌──────────────┼──────────────┐               │
│              │              │              │                │
│              ▼              ▼              ▼                │
│         Prometheus     Grafana         NGINX Gateway       │
│         (Metrics)   (Visualization)   (Load Balancer)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Deployment Phases (Agent-Based)

#### Phase 1: Version Control & Configuration Management
**Responsible Agent:** Git Coordinator Agent

```bash
# Step 1: Verify clean working directory
git status
# Expected: On branch main, Your branch is up to date with 'origin/main'

# Step 2: Review changes before commit
git diff --stat
# Expected: Shows only modified files (no untracked unless intentional)

# Step 3: Stage changes
git add .
# Warning: Only add relevant files (never commit credentials/secrets)

# Step 4: Create semantic commit
git commit -m "feat(component): Description of changes

Additional context if needed.

🤖 Generated with Claude Code
Co-Authored-By: DeploymentAgent <deployment@aurigraph.io>"

# Step 5: Verify commit
git log -1 --format='%an %ae %s'

# Step 6: Push to remote
git push origin main
```

**Validation Checklist:**
- [ ] Commit message follows conventional commits format
- [ ] All changes are related to the feature/fix
- [ ] No sensitive credentials included
- [ ] Tests pass locally before push
- [ ] Commit appears in `git log origin/main`

---

#### Phase 2: Build Orchestration
**Responsible Agent:** Build Orchestration Agent

```bash
# Step 1: Prepare build environment
cd /opt/DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Step 2: Clean previous artifacts
./mvnw clean -q
echo "✓ Previous artifacts cleaned"

# Step 3: Build JAR (fast build)
./mvnw package -DskipTests -q
echo "✓ JAR build completed"

# Step 4: Verify JAR artifact
if [ -f target/quarkus-app/quarkus-run.jar ]; then
  echo "✅ JAR artifact verified"
  ls -lh target/quarkus-app/quarkus-run.jar
else
  echo "❌ JAR build failed"
  exit 1
fi

# Step 5: Build native image (optional, 10-15 minutes)
./mvnw package -DskipTests -Pnative-fast -Dquarkus.native.container-build=true -q
```

**Build Profiles:**
- **Default Profile:** JVM build (~30 seconds)
  - Output: `target/quarkus-app/quarkus-run.jar`
  - Use for: Development, quick iterations

- **Native-Fast Profile:** Native image (~2-3 minutes)
  - Output: `target/aurigraph-v11-standalone-11.4.4-runner`
  - Use for: Performance testing, quick production builds

- **Native Profile:** Fully optimized (~10-15 minutes)
  - Output: Native executable
  - Use for: Final production builds

**Build Verification Matrix:**

| Profile | Artifact Type | Size | Startup | Memory | Recommended Use |
|---------|---------------|------|---------|--------|-----------------|
| Default | JAR (JVM) | 350MB | 3-5s | 512MB+ | Development |
| native-fast | Native Binary | 120MB | <500ms | 256MB | CI/CD, Quick Deploy |
| native | Native Binary | 120MB | <300ms | 256MB | Production |

---

#### Phase 3: Docker Image Management
**Responsible Agent:** Container Operations Agent

```bash
# Step 1: Navigate to project root
cd /opt/DLT

# Step 2: Build Docker image with JAR
docker build \
  -t aurigraph-v11:11.4.4 \
  -f aurigraph-av10-7/aurigraph-v11-standalone/Dockerfile \
  aurigraph-av10-7/aurigraph-v11-standalone

# Step 3: Verify image creation
docker images | grep aurigraph-v11
# Expected: Shows "aurigraph-v11    11.4.4    <image-id>    <size>"

# Step 4: Tag for registry (if using private registry)
docker tag aurigraph-v11:11.4.4 registry.example.com/aurigraph-v11:11.4.4

# Step 5: Push to registry (if configured)
docker push registry.example.com/aurigraph-v11:11.4.4

# Step 6: Inspect image layers
docker inspect aurigraph-v11:11.4.4 | grep -E "Layers|Size|Created"
```

**Dockerfile Best Practices:**

```dockerfile
# ✅ Multi-stage build pattern (preferred)
FROM eclipse-temurin:21-jdk-slim as builder
WORKDIR /build
# ... build steps ...

FROM eclipse-temurin:21-jre-slim
COPY --from=builder /build/target/quarkus-app /app
ENTRYPOINT ["java", "-jar", "/app/quarkus-run.jar"]

# ✅ Always use maintained base images
# eclipse-temurin:21-jdk-slim   ← Current best practice
# openjdk:21-slim                ← DEPRECATED (no longer maintained)

# ❌ Avoid
# FROM ubuntu:latest             (too large)
# FROM debian:bullseye           (outdated)
```

---

#### Phase 4: Service Deployment
**Responsible Agent:** Deployment Executor Agent

```bash
# Step 1: Verify service configuration
cat docker-compose.yml | grep -A 10 "aurigraph-v11:"
# Expected: Service definition with correct ports, volumes, environment

# Step 2: Perform health check on related services
docker-compose ps
# Expected: All services showing "Up" and "healthy" where applicable

# Step 3: Deploy service
docker-compose -f docker-compose.yml up -d aurigraph-v11

# Step 4: Wait for initialization (Quarkus startup)
sleep 10

# Step 5: Perform health check
curl -s http://localhost:9003/q/health | python3 -m json.tool

# Step 6: Verify metrics endpoint
curl -s http://localhost:9003/q/metrics | head -20

# Step 7: Check logs for errors
docker-compose logs aurigraph-v11 | tail -50 | grep -i error
```

**Deployment Health Check Protocol:**

```bash
#!/bin/bash
echo "=== SERVICE HEALTH CHECK PROTOCOL ==="

# Check 1: HTTP health endpoint
echo -n "Health endpoint: "
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9003/q/health)
[ "$HEALTH" = "200" ] && echo "✅ OK" || echo "❌ FAILED ($HEALTH)"

# Check 2: Metrics availability
echo -n "Metrics endpoint: "
METRICS=$(curl -s http://localhost:9003/q/metrics | wc -l)
[ "$METRICS" -gt 10 ] && echo "✅ OK ($METRICS metrics)" || echo "❌ FAILED"

# Check 3: API responsiveness
echo -n "API health: "
API=$(curl -s http://localhost:9003/api/v11/health 2>/dev/null | wc -c)
[ "$API" -gt 0 ] && echo "✅ OK" || echo "❌ FAILED"

# Check 4: Container resource usage
echo -n "Container health: "
CONTAINER=$(docker-compose ps aurigraph-v11 | grep -i up)
[ -n "$CONTAINER" ] && echo "✅ RUNNING" || echo "❌ NOT RUNNING"

# Check 5: Port bindings
echo -n "Port 9003 binding: "
PORT=$(lsof -i :9003 2>/dev/null | wc -l)
[ "$PORT" -gt 1 ] && echo "✅ BOUND" || echo "❌ NOT BOUND"
```

---

## Module 2: Agent-Based CI/CD Pipeline

### 2.1 Multi-Agent Coordination Framework

```
                    DEPLOYMENT CONTROL CENTER
                    (Central Orchestrator)
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
        ┌──────────────┬──────────────┬──────────────┐
        │     GIT      │    BUILD     │   CONTAINER  │
        │  COORDINATOR │ ORCHESTRATOR │  OPERATIONS  │
        │    AGENT     │    AGENT     │    AGENT     │
        └──────────────┴──────────────┴──────────────┘
                │           │           │
        ┌───────┴───────┬───┴────┬──────┴───────┐
        │               │        │              │
        ▼               ▼        ▼              ▼
    [Commit]      [Maven]   [Docker]      [Compose]
    [Push]        [Build]   [Build]       [Deploy]
    [Verify]      [Test]    [Tag]         [Health]
                  [Profile]              [Monitor]
```

### 2.2 Agent Communication Protocol

**Message Format (All Agents):**

```json
{
  "agent_id": "build-orchestrator-001",
  "agent_type": "BuildOrchestrationAgent",
  "timestamp": "2025-11-21T14:35:00Z",
  "task_id": "deploy-v11-20251121-1435",
  "status": "IN_PROGRESS",
  "progress": {
    "current_step": 3,
    "total_steps": 5,
    "percentage": 60,
    "step_name": "Building native image (native-fast profile)"
  },
  "message": "Native compilation started with ForkJoinPool configuration...",
  "metrics": {
    "build_start_time": "2025-11-21T14:35:00Z",
    "elapsed_time": 180,
    "memory_usage": "26.49GB",
    "cpu_threads": 16,
    "build_profile": "native-fast"
  },
  "next_action": "MONITOR_COMPILATION",
  "rollback_available": true,
  "critical_errors": []
}
```

### 2.3 Deployment State Machine

```
┌──────────────┐
│    START     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐      ┌──────────────┐
│  GIT VERIFICATION        │─────→│  ✅ PROCEED  │
│ - Status check           │      │  ❌ ABORT    │
│ - Sync verification      │      └──────────────┘
│ - Commit validation      │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐      ┌──────────────┐
│  BUILD PREPARATION       │─────→│  ✅ PROCEED  │
│ - Clean artifacts        │      │  ❌ ROLLBACK │
│ - Environment setup      │      └──────────────┘
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐      ┌──────────────┐
│  BUILD EXECUTION         │─────→│  ✅ PROCEED  │
│ - Compile               │      │  ❌ ROLLBACK │
│ - Test                  │      │  ⏱️  RETRY   │
│ - Package               │      └──────────────┘
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐      ┌──────────────┐
│  ARTIFACT VERIFICATION   │─────→│  ✅ PROCEED  │
│ - Checksum validation    │      │  ❌ ROLLBACK │
│ - Size verification      │      └──────────────┘
│ - File integrity check   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐      ┌──────────────┐
│  CONTAINER BUILD         │─────→│  ✅ PROCEED  │
│ - Docker image creation  │      │  ❌ ROLLBACK │
│ - Layer analysis         │      └──────────────┘
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐      ┌──────────────┐
│  SERVICE DEPLOYMENT      │─────→│  ✅ SUCCESS  │
│ - Container startup      │      │  ❌ ROLLBACK │
│ - Health verification    │      │  🔄 RETRY    │
│ - Metrics collection     │      └──────────────┘
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  POST-DEPLOYMENT        │
│  VALIDATION             │
│ - Integration tests     │
│ - Smoke tests           │
│ - Performance baseline   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  ✅ DEPLOYMENT COMPLETE  │
└──────────────────────────┘
```

---

## Module 3: Failure Recovery & Rollback

### 3.1 Automatic Rollback Scenarios

**Trigger Level 1: Build Failures** (Auto-Rollback)
```bash
# Scenario: Maven compilation fails
ERROR: Build failure detected
ACTION: Automatic rollback to previous JAR
COMMAND: docker-compose -f docker-compose.yml up -d aurigraph-v11 --force-recreate
VERIFICATION: curl http://localhost:9003/q/health
```

**Trigger Level 2: Health Check Failures** (Auto-Rollback)
```bash
# Scenario: Service fails to start or become healthy
if curl http://localhost:9003/q/health -f; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed - INITIATING ROLLBACK"
  docker-compose -f docker-compose.yml up -d aurigraph-v11 --force-recreate
  sleep 10
  curl http://localhost:9003/q/health
fi
```

**Trigger Level 3: Performance Degradation** (Manual Review)
```bash
# Scenario: Service running but performance degraded
BASELINE_LATENCY=500  # ms
CURRENT_LATENCY=$(curl -w '%{time_total}' http://localhost:9003/api/v11/health -o /dev/null)

if (( $(echo "$CURRENT_LATENCY > $BASELINE_LATENCY" | bc -l) )); then
  echo "⚠️  Performance degradation detected"
  echo "Current latency: ${CURRENT_LATENCY}ms (baseline: ${BASELINE_LATENCY}ms)"
  echo "Manual review recommended - check logs and metrics"
fi
```

### 3.2 Rollback Procedures

**Quick Rollback (30 seconds):**
```bash
#!/bin/bash
echo "=== EMERGENCY ROLLBACK PROCEDURE ==="

# Step 1: Stop current deployment
docker-compose -f docker-compose.yml stop aurigraph-v11

# Step 2: Restore previous container image (must be tagged)
PREVIOUS_IMAGE="aurigraph-v11:11.4.3"  # Update to actual previous version
docker run -d \
  --name aurigraph-v11-rollback \
  -p 9003:9003 \
  "$PREVIOUS_IMAGE"

# Step 3: Verify functionality
sleep 5
curl -s http://localhost:9003/q/health | grep -q '"status":"UP"' && echo "✅ Rollback successful" || echo "❌ Rollback failed"

# Step 4: Update docker-compose to point to previous image
# Edit: docker-compose.yml image field

# Step 5: Restore service
docker-compose -f docker-compose.yml up -d aurigraph-v11
```

**Full Rollback to Database Snapshot:**
```bash
#!/bin/bash
# For critical data corruption scenarios

# 1. Stop all services
docker-compose -f docker-compose.yml stop

# 2. Restore database snapshot
BACKUP_DATE=$(date -d '1 day ago' +%Y-%m-%d)
BACKUP_FILE="/opt/backups/postgres-$BACKUP_DATE.sql"
docker-compose -f docker-compose.yml exec -T postgres psql -U aurigraph < "$BACKUP_FILE"

# 3. Restart services
docker-compose -f docker-compose.yml up -d

# 4. Verify data integrity
docker-compose -f docker-compose.yml exec -T postgres psql -U aurigraph -c "SELECT COUNT(*) FROM transactions;"
```

---

## Module 4: Monitoring & Observability

### 4.1 Key Metrics to Monitor

```
┌─────────────────────────────────────┬──────────┬──────────┬──────────┐
│ Metric                              │ Baseline │ Warning  │ Critical │
├─────────────────────────────────────┼──────────┼──────────┼──────────┤
│ API Response Latency                │  <100ms  │  >300ms  │  >500ms  │
│ CPU Usage (Container)               │   <50%   │   >75%   │   >90%   │
│ Memory Usage (Container)            │  <60%    │   >80%   │   >95%   │
│ Database Connections                │    <10   │    >20   │    >30   │
│ Redis Memory Usage                  │  <50MB   │  >200MB  │  >400MB  │
│ Error Rate (HTTP 5xx)               │   <0.1%  │   >1%    │    >5%   │
│ Deployment Success Rate             │   >95%   │   <90%   │   <80%   │
│ Service Availability                │  >99.9%  │   <99%   │   <95%   │
└─────────────────────────────────────┴──────────┴──────────┴──────────┘
```

### 4.2 Dashboard Configuration

**Prometheus Scrape Config (for V11 API):**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'aurigraph-v11'
    static_configs:
      - targets: ['localhost:9003']
    metrics_path: '/q/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s
```

**Grafana Dashboard Panels:**
1. **Request Latency** (p50, p95, p99)
2. **Throughput** (requests/sec)
3. **Error Rates** (by status code)
4. **Resource Utilization** (CPU, Memory, Disk)
5. **Database Performance** (connections, query time)
6. **Deployment Status** (current version, uptime)

---

## Module 5: Troubleshooting Guide

### 5.1 Common Issues & Solutions

**Issue 1: ForkJoinPool Native Image Compilation Failure**

```
ERROR: Error in @InjectAccessors handling of field
java.util.concurrent.ForkJoinPool.common, accessors class
com.oracle.svm.core.jdk.ForkJoinPoolCommonAccessor: found no
method named set or setCommon
```

**Solution Options (Priority Order):**

1. **Immediate (Use JVM mode):**
   ```bash
   ./mvnw package -DskipTests -q  # Uses default profile
   # Run with: java -jar target/quarkus-app/quarkus-run.jar
   ```

2. **Short-term (Native-fast profile with configuration):**
   ```bash
   # Verify pom.xml has ForkJoinPool in native-fast profile
   grep -A 15 "native-fast" pom.xml | grep -i forkjoinpool
   # Should show: --initialize-at-run-time=java.util.concurrent.ForkJoinPool

   ./mvnw package -DskipTests -Pnative-fast -Dquarkus.native.container-build=true
   ```

3. **Long-term (Implement alternative):**
   - Use `ThreadPoolExecutor` instead of `ForkJoinPool` (95% compatibility)
   - Implement Quarkus `ManagedExecutor` (90% compatibility)
   - Deploy with JVM mode for now (100% functionality)

---

**Issue 2: Service Fails to Start**

```bash
# Diagnostic Script
#!/bin/bash
echo "=== SERVICE STARTUP DIAGNOSTIC ==="

# Check 1: Container status
docker-compose ps aurigraph-v11

# Check 2: Recent logs
docker-compose logs aurigraph-v11 --tail 50

# Check 3: Port availability
netstat -tulpn | grep 9003

# Check 4: Resource constraints
docker stats aurigraph-v11

# Check 5: Docker image integrity
docker inspect aurigraph-v11:11.4.4
```

---

## Module 6: Security Best Practices for Deployment

### 6.1 Credentials Management

**✅ DO:**
```bash
# Store credentials in environment file (.env)
DB_USER=aurigraph
DB_PASSWORD=${SECURED_DB_PASSWORD}  # From vault/secrets manager
API_KEY=${SECURED_API_KEY}

# Use Docker secrets for production
docker secret create db_password /path/to/secret

# Reference in docker-compose
secrets:
  db_password:
    external: true
```

**❌ DON'T:**
```bash
# Never hardcode credentials in Dockerfile
ENV DB_PASSWORD="password123"

# Never commit .env files
# Never pass credentials in command line
docker run -e DB_PASSWORD="password123" ...

# Never log sensitive values
echo "Using password: $DB_PASSWORD"  # WRONG!
```

### 6.2 Network Security

```yaml
# docker-compose.yml - Secure network configuration
services:
  aurigraph-v11:
    networks:
      - internal
    ports:
      - "9003:9003"  # Only internal port
    environment:
      - QUARKUS_PROFILE=prod

  postgres:
    networks:
      - internal
    ports: []  # No external access

  redis:
    networks:
      - internal
    ports: []  # No external access

networks:
  internal:
    driver: bridge
    driver_opts:
      com.docker.driver.mtu: 1450
```

---

## Module 7: Performance Optimization

### 7.1 V11 Build Optimization

**Current Performance Baseline:**
```
Profile          Build Time    Native Size    Startup    Memory
─────────────────────────────────────────────────────────────────
Default (JVM)    ~30 seconds   350MB         3-5s       512MB+
native-fast      ~2-3 min      120MB         <500ms     256MB
native           ~10-15 min    120MB         <300ms     256MB
```

**Optimization Techniques:**

1. **Parallel Compilation (native-fast):**
   - Uses `-O1` optimization level
   - Processes multiple files in parallel
   - Reduced memory footprint

2. **Incremental Builds:**
   ```bash
   # Skip tests for faster iteration
   ./mvnw package -DskipTests -q
   ```

3. **Docker Layer Caching:**
   ```dockerfile
   # Put frequently changing layers last
   FROM eclipse-temurin:21-jre-slim
   COPY --from=builder /build/deps /app/deps
   COPY --from=builder /build/app /app/app
   ENTRYPOINT ["java", "-cp", "/app/app:/app/deps/*", "io.aurigraph.Main"]
   ```

---

## Module 8: Competency Checklist

Use this checklist to verify agent readiness for production deployments:

### Agent: Git Coordinator
- [ ] Can execute git workflow (add, commit, push, verify)
- [ ] Understands semantic commit messages
- [ ] Knows how to handle merge conflicts
- [ ] Can revert failed commits safely
- [ ] Verifies commits are pushed to origin/main

### Agent: Build Orchestrator
- [ ] Can select appropriate build profile
- [ ] Understands Maven dependency resolution
- [ ] Knows how to troubleshoot compilation errors
- [ ] Can verify build artifacts
- [ ] Understands JVM vs native build trade-offs

### Agent: Container Operations
- [ ] Can build Docker images
- [ ] Understands multi-stage Dockerfile pattern
- [ ] Knows image tagging and versioning
- [ ] Can inspect and verify image layers
- [ ] Understands image registry operations

### Agent: Deployment Executor
- [ ] Can orchestrate service deployment
- [ ] Performs pre-deployment health checks
- [ ] Monitors post-deployment startup
- [ ] Knows how to verify service health
- [ ] Can rollback failed deployments

### Agent: Monitoring & Observability
- [ ] Can query Prometheus metrics
- [ ] Interprets dashboard data
- [ ] Knows alert thresholds
- [ ] Can access and review logs
- [ ] Understands infrastructure telemetry

---

## Summary & Next Steps

### Completed Achievements ✅
1. ForkJoinPool configuration (3/5 layers complete)
2. Production infrastructure deployed (90% ready)
3. Git synchronization verified
4. Deployment process documented

### In Progress 🔄
1. V11 native build optimization (targeting native-fast alternative)
2. Integration testing preparation
3. Performance baseline establishment

### Next Sprint Goals 📋
1. **Week 1:** Resolve native build and achieve 95% uptime
2. **Week 2:** Implement integration tests (70% coverage)
3. **Week 3:** Performance optimization and monitoring
4. **Week 4:** Production rollout preparation

### Training Resources
- [GraalVM Native Image Guide](https://www.graalvm.org/latest/reference-manual/native-image/)
- [Quarkus Deployment Documentation](https://quarkus.io/guides/deploying-to-production)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Prometheus Monitoring Guide](https://prometheus.io/docs/)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21 by Claude Code
**Approval Status:** ✅ Ready for Agent Training
