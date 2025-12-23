# CI/CD Quality Gates - Aurigraph V11 Standalone

**Created**: October 12, 2025
**Status**: ✅ ACTIVE
**Pipeline**: GitHub Actions
**Coverage Tool**: JaCoCo 0.8.11
**Quality Platform**: SonarQube
**Security Scanner**: OWASP Dependency Check

---

## Executive Summary

This document describes the CI/CD pipeline and quality gates implemented for Aurigraph V11 Standalone. The pipeline enforces **95% code coverage**, automated testing, security scanning, and production deployment.

**Key Features**:
- ✅ Automated build and test on every commit
- ✅ 95% line coverage, 90% branch coverage enforcement
- ✅ SonarQube code quality analysis
- ✅ OWASP security vulnerability scanning
- ✅ Native image build validation
- ✅ Automated production deployment
- ✅ Performance benchmark testing

---

## Table of Contents

1. [Pipeline Overview](#pipeline-overview)
2. [Quality Gates](#quality-gates)
3. [Coverage Requirements](#coverage-requirements)
4. [Pipeline Jobs](#pipeline-jobs)
5. [Configuration Files](#configuration-files)
6. [Secrets Management](#secrets-management)
7. [Local Testing](#local-testing)
8. [Troubleshooting](#troubleshooting)
9. [Metrics and Reporting](#metrics-and-reporting)

---

## Pipeline Overview

### Trigger Events

The CI/CD pipeline runs on:
- **Push to `main` or `develop`**: Full pipeline with deployment
- **Pull Request**: Build, test, and quality checks (no deployment)
- **Manual Trigger**: `workflow_dispatch` for on-demand runs

### Pipeline Duration

| Job | Average Duration | Timeout |
|-----|-----------------|---------|
| Build and Test | 5-10 minutes | 30 minutes |
| SonarQube Analysis | 3-5 minutes | 20 minutes |
| Security Scan | 5-8 minutes | 15 minutes |
| Native Build | 20-40 minutes | 60 minutes |
| Docker Build | 10-15 minutes | 30 minutes |
| Deploy Production | 3-5 minutes | 15 minutes |
| Performance Test | 10-15 minutes | 20 minutes |
| **Total** | **40-60 minutes** | **N/A** |

---

## Quality Gates

### Build Quality Gates

All quality gates **MUST PASS** for the build to succeed:

#### 1. **Code Coverage** (JaCoCo)

| Scope | Line Coverage | Branch Coverage | Enforcement |
|-------|---------------|-----------------|-------------|
| **Overall Project** | **95%** | **90%** | ✅ FAIL BUILD |
| Crypto Package | 98% | 95% | ✅ FAIL BUILD |
| Consensus Package | 95% | 90% | ✅ FAIL BUILD |
| ParallelTransactionExecutor | 95% | 90% | ✅ FAIL BUILD |
| EthereumBridgeService | 95% | 90% | ✅ FAIL BUILD |
| SystemMonitoringService | 95% | 90% | ✅ FAIL BUILD |
| EnterprisePortalService | 95% | 90% | ✅ FAIL BUILD |

**Failure Action**: Build fails if any threshold is not met.

#### 2. **Test Execution**

- ✅ **All tests must pass** (0 failures, 0 errors)
- ✅ Test execution time < 10 minutes
- ✅ No flaky tests (3+ consecutive passes required)

#### 3. **SonarQube Quality Gate**

| Metric | Threshold | Enforcement |
|--------|-----------|-------------|
| Security Rating | A | ⚠️ WARNING |
| Reliability Rating | A | ⚠️ WARNING |
| Maintainability Rating | A | ⚠️ WARNING |
| Code Smells | < 50 | ⚠️ WARNING |
| Bugs | 0 | ✅ FAIL BUILD |
| Vulnerabilities | 0 | ✅ FAIL BUILD |
| Security Hotspots Reviewed | > 80% | ⚠️ WARNING |

**Note**: SonarQube failures are warnings only (won't fail build) to allow gradual improvement.

#### 4. **Security Scan** (OWASP)

- ✅ **No Critical or High CVEs** (CVSS >= 7.0)
- ⚠️ Medium CVEs (CVSS 4.0-6.9) generate warnings
- ℹ️ Low CVEs (CVSS < 4.0) are informational

**Suppressions**: Known false positives are suppressed in `owasp-suppressions.xml`

#### 5. **Native Build Validation**

- ✅ Native image builds successfully
- ✅ Native executable starts in < 10 seconds
- ✅ Health check endpoint responds (200 OK)
- ✅ Binary size < 150MB

---

## Coverage Requirements

### Package-Level Coverage

```
io.aurigraph.v11
├── crypto/              ≥ 98% line, 95% branch  [CRITICAL]
├── consensus/           ≥ 95% line, 90% branch  [CRITICAL]
├── parallel/            ≥ 95% line, 90% branch  [HIGH]
├── bridge/              ≥ 95% line, 90% branch  [HIGH]
├── monitoring/          ≥ 95% line, 90% branch  [HIGH]
├── portal/              ≥ 95% line, 90% branch  [HIGH]
├── tokens/              ≥ 95% line, 90% branch  [MEDIUM]
└── (all other)          ≥ 95% line, 90% branch  [MEDIUM]
```

### Exclusions

The following are **excluded** from coverage requirements:

- Generated code: `**/generated/**`, `**/*_generated/**`
- DTOs/Records: `**/models/**/*Record.java`
- Configuration: `**/*Config.java`, `**/*Application.java`
- Proto files: `**/proto/**`

### Coverage Reporting

Reports are generated in multiple formats:
- **HTML**: `target/site/jacoco/index.html`
- **XML**: `target/site/jacoco/jacoco.xml` (for SonarQube)
- **CSV**: `target/site/jacoco/jacoco.csv` (for data analysis)

---

## Pipeline Jobs

### Job 1: Build and Test

**Purpose**: Compile code, run all tests, generate coverage reports

**Steps**:
1. Checkout code (full history for SonarQube)
2. Set up JDK 21 (Temurin distribution)
3. Cache Maven dependencies
4. Build with `./mvnw clean compile -DskipTests`
5. Run tests with `./mvnw test`
6. Generate JaCoCo coverage report
7. Check coverage thresholds (fails if < 95%)
8. Upload coverage artifacts
9. Publish test results
10. Comment coverage on PR (if applicable)

**Artifacts**: `jacoco-coverage-reports` (30 days retention)

---

### Job 2: SonarQube Analysis

**Purpose**: Code quality analysis and technical debt tracking

**Steps**:
1. Checkout code
2. Download coverage reports from Job 1
3. Run SonarQube scan with quality gate wait
4. Publish results to SonarQube server

**Requirements**:
- `SONAR_TOKEN` secret configured
- `SONAR_HOST_URL` secret configured
- SonarQube project created

**Skip**: Set `continue-on-error: true` to avoid blocking builds initially

---

### Job 3: Security Scan

**Purpose**: Identify security vulnerabilities in dependencies

**Steps**:
1. Checkout code
2. Run OWASP Dependency Check
3. Fail build if CVSS >= 7.0
4. Upload security report artifact

**Artifacts**: `security-scan-report` (30 days retention)

**Suppressions**: See `owasp-suppressions.xml`

---

### Job 4: Native Build Validation

**Purpose**: Validate GraalVM native compilation

**Conditions**:
- Only on `main` branch
- Or manual `workflow_dispatch`

**Steps**:
1. Checkout code
2. Set up Docker Buildx
3. Build native image (container build)
4. Start native executable (10s timeout)
5. Health check via curl
6. Upload native executable artifact

**Artifacts**: `native-executable` (7 days retention)

**Duration**: ~40 minutes (optimization ongoing)

---

### Job 5: Docker Build and Push

**Purpose**: Build and push Docker images

**Conditions**: Only on `main` branch

**Steps**:
1. Checkout code
2. Login to Docker Hub
3. Build JVM image (`Dockerfile.jvm`)
4. Push with tags: `latest` and `jvm-<sha>`
5. Use Docker layer caching

**Requirements**:
- `DOCKER_USERNAME` secret
- `DOCKER_PASSWORD` secret

---

### Job 6: Deploy to Production

**Purpose**: Deploy native executable to production server

**Conditions**:
- Only on `main` branch
- Only on `push` events (not PRs)

**Environment**: `production` (dlt.aurigraph.io)

**Steps**:
1. Download native executable from Job 4
2. SCP to production server (`/opt/aurigraph-v11/`)
3. Restart systemd service (`aurigraph-v11`)
4. Wait 10 seconds
5. Health check via HTTPS

**Requirements**:
- `REMOTE_HOST` secret (dlt.aurigraph.io)
- `REMOTE_USER` secret (subbu)
- `REMOTE_PASSWORD` secret

**Rollback**: Manual SSH access required if deployment fails

---

### Job 7: Performance Benchmark

**Purpose**: Measure TPS throughput

**Conditions**:
- Pull requests
- Manual `workflow_dispatch`

**Steps**:
1. Build application
2. Start Quarkus application
3. Run performance endpoint (100K iterations, 16 threads)
4. Upload performance results

**Artifacts**: `performance-report` (30 days retention)

**Current Baseline**: 9.9K TPS (target: 50K → 2M TPS)

---

### Job 8: Quality Gate Summary

**Purpose**: Aggregate all quality gate results

**Conditions**: Always runs (even if previous jobs fail)

**Output**: GitHub Actions summary with pass/fail status for each gate

---

## Configuration Files

### 1. `.github/workflows/ci-cd-pipeline.yml`

Main GitHub Actions workflow file defining all jobs and steps.

### 2. `pom.xml` (JaCoCo Plugin)

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <id>jacoco-check</id>
            <phase>verify</phase>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <!-- 95% line coverage, 90% branch coverage -->
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### 3. `sonar-project.properties`

SonarQube configuration file:
- Project key: `aurigraph-v11-standalone`
- Coverage reports: `target/site/jacoco/jacoco.xml`
- Quality gate thresholds: 95% line, 90% branch

### 4. `owasp-suppressions.xml`

OWASP Dependency Check suppressions for known false positives.

---

## Secrets Management

### Required GitHub Secrets

Configure these in **Settings → Secrets and variables → Actions**:

#### SonarQube
- `SONAR_TOKEN`: SonarQube authentication token
- `SONAR_HOST_URL`: SonarQube server URL (e.g., https://sonarqube.aurigraph.io)

#### Docker Hub
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password or access token

#### Production Server
- `REMOTE_HOST`: Production server hostname (dlt.aurigraph.io)
- `REMOTE_USER`: SSH username (subbu)
- `REMOTE_PASSWORD`: SSH password (consider using SSH keys in production)

### Secrets Security

- ✅ Never log secrets in workflow output
- ✅ Use `secrets.<NAME>` syntax in workflow
- ✅ Rotate secrets every 90 days
- ✅ Use environment-specific secrets for staging/production

---

## Local Testing

### Test Coverage Locally

```bash
# Run tests with coverage
./mvnw clean test jacoco:report

# Check coverage thresholds
./mvnw jacoco:check

# View HTML report
open target/site/jacoco/index.html
```

### Test SonarQube Locally

```bash
# Requires SonarQube server running locally or remote
export SONAR_TOKEN="your-token"
export SONAR_HOST_URL="http://localhost:9000"

./mvnw sonar:sonar \
  -Dsonar.projectKey=aurigraph-v11-standalone \
  -Dsonar.host.url=$SONAR_HOST_URL \
  -Dsonar.login=$SONAR_TOKEN
```

### Test Security Scan Locally

```bash
./mvnw org.owasp:dependency-check-maven:check \
  -DfailBuildOnCVSS=7 \
  -DsuppressionFiles=owasp-suppressions.xml

# View report
open target/dependency-check-report.html
```

### Test Native Build Locally

```bash
./mvnw package -Pnative -DskipTests -Dquarkus.native.container-build=true

# Run native executable
chmod +x target/*-runner
./target/*-runner &

# Test health endpoint
curl http://localhost:9003/q/health
```

---

## Troubleshooting

### Coverage Check Failing

**Symptom**: `jacoco:check` fails with "Coverage is X%, expected 95%"

**Solutions**:
1. Run `./mvnw jacoco:report` and review `target/site/jacoco/index.html`
2. Identify uncovered lines/branches
3. Add tests for uncovered code
4. Consider if code should be excluded (config, generated)

### SonarQube Scan Failing

**Symptom**: SonarQube scan fails with 403 or authentication error

**Solutions**:
1. Verify `SONAR_TOKEN` is valid
2. Check `SONAR_HOST_URL` is accessible
3. Ensure SonarQube project exists
4. Review SonarQube server logs

### Native Build Failing

**Symptom**: Native build fails with reflection or resource errors

**Solutions**:
1. Check `application.properties` for native configuration
2. Add reflection configuration in `reflect-config.json`
3. Add resource configuration in `resource-config.json`
4. Review GraalVM native-image logs

### Deployment Failing

**Symptom**: Deployment to production fails with connection error

**Solutions**:
1. Verify SSH credentials in secrets
2. Check firewall rules on production server
3. Ensure systemd service is configured
4. Review server logs: `journalctl -u aurigraph-v11 -f`

---

## Metrics and Reporting

### Coverage Trends

Track coverage over time in SonarQube "Activity" tab:
- Overall coverage trend
- New code coverage
- Coverage by package

### Build Success Rate

Monitor in GitHub Actions "Actions" tab:
- % successful builds
- Average build duration
- Failure patterns

### Security Vulnerabilities

Review OWASP reports for:
- High/Critical CVE count
- Dependency update recommendations
- Suppression effectiveness

### Performance Benchmarks

Track TPS metrics over time:
- Current: 9.9K TPS
- Phase 1 Target: 50K TPS
- Phase 2 Target: 200K TPS
- Phase 3 Target: 2M+ TPS

---

## Next Steps

### Immediate (Week 1)
- ✅ Configure GitHub Secrets (SonarQube, Docker, Production)
- ✅ Create SonarQube project and quality gate
- ✅ Run pipeline on pull request
- ✅ Validate coverage enforcement

### Short-term (Week 2-3)
- ✅ Achieve 95% coverage across all Sprint 14-20 services
- ✅ Configure branch protection rules (require CI/CD to pass)
- ✅ Set up Slack/email notifications for build failures
- ✅ Create deployment runbook

### Long-term (Month 1-2)
- ✅ Add integration tests to pipeline
- ✅ Implement blue-green deployment strategy
- ✅ Add performance regression detection
- ✅ Implement automated rollback on health check failure

---

## References

- **JaCoCo Documentation**: https://www.jacoco.org/jacoco/trunk/doc/
- **SonarQube Documentation**: https://docs.sonarqube.org/
- **OWASP Dependency Check**: https://jeremylong.github.io/DependencyCheck/
- **GitHub Actions**: https://docs.github.com/en/actions
- **GraalVM Native Image**: https://www.graalvm.org/latest/reference-manual/native-image/

---

**Document Version**: 1.0
**Last Updated**: October 12, 2025
**Owner**: DevOps & Quality Assurance Team
**Review Cycle**: Monthly

---

*End of CI/CD Quality Gates Documentation*
