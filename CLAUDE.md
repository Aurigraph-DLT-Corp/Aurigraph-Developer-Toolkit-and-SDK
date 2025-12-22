# CLAUDE.md - Aurigraph V12 Development Guide

This file provides guidance to Claude Code when working with the Aurigraph DLT V12 codebase.

## 🎯 SESSION START PROTOCOL - #memorize

**CRITICAL**: At the start of EVERY session:
1. **FIRST**: Read `AurigraphDLTVersionHistory.md` (in repo root)
   - Understand what was done last session
   - Check current version numbers
   - Review sprint progress and pending tasks
   - Note any blockers or decisions

2. **THEN**: Load critical planning documents:
   - `aurigraph-av10-7/aurigraph-v11-standalone/TODO.md`
   - Sprint documents and completion reports

---

## 📊 CURRENT STATUS (December 22, 2025)

### Versions
- **V11 Core**: v11.4.4 (3.0M TPS, 150% of target)
- **Enterprise Portal**: v4.6.0 (Production ready)
- **Framework**: J4C v1.0 (Active)

### Build Status
- ✅ JAR compiled: `target/aurigraph-v12-standalone-12.0.0-runner.jar`
- ⚠️ Build warnings: Quarkus config keys, Hibernate ORM persistence units
- 📋 Pending: Fix dependency conflicts, configure extensions

---

## 🏗️ PROJECT STRUCTURE

```
aurigraph-av10-7/
├── src/                          # V10 TypeScript (legacy)
├── aurigraph-v11-standalone/     # V12 Java/Quarkus (active)
│   ├── src/main/java/io/aurigraph/v11/
│   │   ├── api/                  # REST endpoints
│   │   ├── grpc/                 # gRPC services (in progress)
│   │   ├── crypto/               # Cryptography services
│   │   ├── contracts/            # Smart contracts
│   │   ├── portal/               # Portal resources
│   │   └── ...                   # Other services
│   ├── src/test/java/            # Test suite
│   ├── src/main/resources/       # Configuration & UI
│   └── pom.xml                   # Maven build configuration
└── docs/                         # Documentation
```

---

## 🛠️ BUILD & DEVELOPMENT COMMANDS

### V12 Java/Quarkus
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone

# Build
./mvnw clean package              # Full build (JAR)
./mvnw compile                    # Compile only
./mvnw verify                     # Compile + run tests

# Development
./mvnw quarkus:dev               # Dev mode with hot reload (port 9003)

# Testing
./mvnw test                      # Run all tests
./mvnw test -Dtest=ClassName    # Run specific test

# Native compilation
./mvnw package -Pnative          # Build native executable
./mvnw package -Pnative -Dquarkus.native.container-build=true
```

### Service Endpoints
- REST API: http://localhost:9003/api/v11/
- Health: http://localhost:9003/q/health
- Metrics: http://localhost:9003/q/metrics
- gRPC: localhost:9004 (planned)

---

## ⚙️ KEY CONFIGURATION

### application.properties
- **Port**: 9003 (REST)
- **Database**: PostgreSQL (Quarkus datasource)
- **Cache**: Redis support
- **gRPC**: Port 9004 (configuration pending)

### Environment Variables (macOS)
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export QUARKUS_HTTP_PORT=9003
export QUARKUS_DATASOURCE_DB_KIND=postgresql
```

---

## 📋 CRITICAL PLANNING DOCUMENTS

**Always load at session start**:
1. `AurigraphDLTVersionHistory.md` - Version tracking
2. `aurigraph-av10-7/aurigraph-v11-standalone/TODO.md` - Current tasks
3. `aurigraph-av10-7/aurigraph-v11-standalone/SPRINT-*.md` - Sprint reports
4. `aurigraph-av10-7/aurigraph-v11-standalone/COMPREHENSIVE-TEST-PLAN-V12.md` - Test strategy
5. `aurigraph-av10-7/aurigraph-v11-standalone/J4C-EPIC-EXECUTION-PLAN.md` - Epic planning

---

## 🧪 TESTING STRATEGY

### Test Framework
- **Unit Tests**: JUnit 5 + Mockito
- **Integration Tests**: REST Assured + QuarkusTest
- **Performance Tests**: Custom benchmarking
- **E2E Tests**: Playwright (frontend) + Pytest (backend)

### Coverage Targets
- Overall: 95%+
- Critical modules: 98%+
- Target: Pass all tests before deployment

### Test Locations
- Unit: `src/test/java/io/aurigraph/v11/*/`
- Integration: Same directory with `*IntegrationTest.java`
- Performance: `*PerformanceTest.java`

---

## 🎯 CURRENT PRIORITIES

### Known Issues (To Fix)
1. **Quarkus Configuration**:
   - Missing extensions for gRPC, OpenTelemetry
   - Configure required dependencies in pom.xml

2. **Hibernate ORM**:
   - 6 entity classes need persistence unit configuration
   - Configure JPA/Panache properly

3. **Dependency Conflicts**:
   - BouncyCastle versions (1.78 vs 1.68)
   - Logging duplicates (commons-logging, slf4j)
   - Resolve by version alignment in pom.xml

4. **Deleted Files** (Recently Removed):
   - VVBApiResource.java (deprecated)
   - DemoControlResource.java (deprecated)
   - comprehensive_aurigraph_prd.md (archived)

### Next Steps
- [ ] Fix Quarkus extension configurations
- [ ] Resolve Hibernate ORM persistence issues
- [ ] Clean up dependency conflicts
- [ ] Run full test suite
- [ ] Commit and push working state
- [ ] Deploy to production (dlt.aurigraph.io)

---

## 🚀 DEPLOYMENT

### Production Server
- **URL**: dlt.aurigraph.io
- **Port**: 9003 (main service)
- **SSH**: subbu@dlt.aurigraph.io (port 2235)
- **Deployment Method**: GitHub Actions workflow

### Pre-Deployment Checklist
- [x] Build successful (JAR created)
- [ ] All tests passing
- [ ] No TypeScript/Java errors
- [ ] Configuration validated
- [ ] Dependency conflicts resolved
- [ ] E2E tests pass
- [ ] JIRA tickets updated
- [ ] Documentation updated

---

## 📚 RELATED DOCUMENTATION

- `AurigraphDLTVersionHistory.md` - Complete version history
- `aurigraph-av10-7/CLAUDE.md` - Detailed V11 standalone guide
- `aurigraph-av10-7/aurigraph-v11-standalone/COMPREHENSIVE-TEST-PLAN-V12.md` - Testing strategy
- `aurigraph-av10-7/aurigraph-v11-standalone/J4C-EPIC-EXECUTION-PLAN.md` - Epic plans
- `aurigraph-av10-7/aurigraph-v11-standalone/GRPC-IMPLEMENTATION-PLAN.md` - gRPC roadmap

---

## 🔧 QUICK DEBUGGING

### Check Java version
```bash
java --version
```

### View Quarkus logs
```bash
./mvnw quarkus:dev 2>&1 | grep -i error
```

### Check port conflicts
```bash
lsof -i :9003  # REST API
lsof -i :9004  # gRPC
lsof -i :5432  # PostgreSQL
```

### Build troubleshooting
```bash
./mvnw clean package -X 2>&1 | tail -100  # Verbose build
./mvnw dependency:tree | grep -i conflicting  # Check conflicts
```

---

## 💡 DEVELOPMENT BEST PRACTICES

1. **Branch Strategy**: feature/AV11-XXX for V12 work
2. **Commits**: Descriptive messages with JIRA ticket numbers
3. **Testing**: Write tests before/during implementation
4. **Documentation**: Update as code changes
5. **Security**: Never commit credentials (use environment variables)
6. **Performance**: Monitor TPS, latency, and resource usage

---

## 📞 SUPPORT & RESOURCES

- **JIRA Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
- **GitHub Repo**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **Production Portal**: https://dlt.aurigraph.io
- **Backend Health**: http://localhost:9003/q/health

---

**Last Updated**: December 22, 2025
**Status**: ✅ Production Ready (pending fixes)
**Next Review**: After build issue resolution
