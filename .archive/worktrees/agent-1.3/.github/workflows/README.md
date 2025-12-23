# Aurigraph V11 CI/CD Pipeline Documentation

## Overview

This directory contains comprehensive CI/CD pipeline configurations for Aurigraph V11, implementing industry-standard practices for continuous integration, continuous deployment, and security scanning.

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Purpose**: Continuous Integration - Build, test, and validate code quality

**Triggers**:
- Push to `main`, `develop`, or feature branches
- Pull requests to `main` or `develop`
- Manual trigger via workflow dispatch

**Jobs**:

1. **Build & Unit Tests**
   - Matrix strategy: JVM mode + Native fast mode
   - Java 21 with Maven caching
   - Unit tests with JaCoCo coverage (≥95% enforced)
   - Artifacts: Quarkus app, native binary, test reports

2. **Integration Tests**
   - PostgreSQL 16 + Redis 7 test services
   - Full integration test suite
   - Database migration validation

3. **Performance Tests**
   - 776K TPS baseline validation
   - JMH benchmarking
   - Performance regression detection

4. **Docker Build & Push**
   - Multi-arch container builds
   - Push to GitHub Container Registry (ghcr.io)
   - Semantic versioning tags
   - Only on `main` or `develop` branches

5. **SonarQube Code Quality**
   - Static code analysis
   - Code coverage validation
   - Quality gate enforcement
   - Technical debt tracking

6. **Build Summary**
   - Consolidated job status
   - Quality metrics dashboard
   - Failure notifications

**Success Criteria**:
- ✅ All tests pass
- ✅ Code coverage ≥95%
- ✅ No high-severity code smells
- ✅ Docker image builds successfully

**Estimated Duration**: 20-30 minutes

---

### 2. Deployment Pipeline (`deploy.yml`)

**Purpose**: Continuous Deployment to staging and production environments

**Triggers**:
- Manual workflow dispatch (any environment)
- Push to `main` branch (staging auto-deploy)
- GitHub release published (production)

**Jobs**:

1. **Pre-Deployment Validation**
   - Environment determination
   - Version extraction from pom.xml
   - Deployment eligibility checks
   - Branch validation

2. **Deploy to Staging**
   - SSH deployment to staging server
   - Docker Compose orchestration
   - Health check validation (30 attempts × 10s)
   - Smoke tests (health, info, metrics, transactions)

3. **Deploy to Production**
   - Blue-green deployment strategy
   - Production backup creation
   - Traffic switching with validation
   - 5-minute monitoring period
   - Smoke tests + extended validation

4. **Rollback Capability**
   - Automatic rollback on failure
   - Restore from latest backup
   - Health verification after rollback
   - Team notifications

5. **Notifications**
   - Slack notifications (success/failure)
   - Deployment summary in GitHub
   - Team alerts on rollback

**Environments**:
- **Staging**: https://staging.dlt.aurigraph.io
- **Production**: https://dlt.aurigraph.io

**Deployment Strategy**:
- **Staging**: Direct deployment with health checks
- **Production**: Blue-green zero-downtime deployment

**Success Criteria**:
- ✅ Service starts within 5 minutes
- ✅ Health checks pass
- ✅ Smoke tests complete successfully
- ✅ No errors during 5-minute monitoring

**Estimated Duration**:
- Staging: 10-15 minutes
- Production: 20-30 minutes

---

### 3. Security Pipeline (`security.yml`)

**Purpose**: Comprehensive security scanning and compliance validation

**Triggers**:
- Push to `main`, `develop`, or feature branches
- Pull requests
- Daily scheduled scan (2 AM UTC)
- Manual trigger via workflow dispatch

**Jobs**:

1. **Secret Scanning**
   - GitLeaks: Detect exposed secrets in git history
   - TruffleHog: Deep secret detection
   - Full repository history scan

2. **Dependency Scanning**
   - OWASP Dependency-Check (CVSS ≥7 fails build)
   - Snyk: Vulnerability detection
   - License compliance validation
   - Suppression file support

3. **SAST - CodeQL**
   - GitHub's semantic code analysis
   - Java security patterns
   - Security + quality queries

4. **SAST - SonarQube**
   - Security hotspot review
   - Vulnerability detection
   - Quality gate enforcement

5. **SAST - Semgrep**
   - Fast pattern-based scanning
   - Auto-configured security rules
   - SARIF output for GitHub Security

6. **Container Scanning**
   - Trivy: OS + application vulnerabilities
   - Grype: Anchore vulnerability scanning
   - Snyk Container: Docker-specific issues
   - Base image validation

7. **License Compliance**
   - Maven license plugin
   - FOSSA license scanning
   - Approved license validation (Apache 2.0, MIT, BSD, EPL 2.0)

8. **IaC Security**
   - Checkov: Dockerfile + docker-compose validation
   - Hadolint: Dockerfile best practices linting

9. **Security Summary**
   - Consolidated security report
   - Compliance dashboard
   - Automatic team notifications on failure

**Security Posture**:
- Quantum Cryptography: CRYSTALS-Kyber + Dilithium (NIST Level 5)
- TLS 1.3 with HTTP/2
- JWT + OAuth 2.0 authentication
- 90-day key rotation policy
- HSM integration for production keys

**Success Criteria**:
- ✅ No secrets detected
- ✅ No high/critical CVEs in dependencies
- ✅ No security vulnerabilities in code
- ✅ All licenses approved
- ✅ Container images secure

**Estimated Duration**: 30-40 minutes

---

## Required Secrets

Configure these secrets in GitHub Settings → Secrets and Variables → Actions:

### General Secrets
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- `SLACK_WEBHOOK_URL` - Slack notifications for deployments
- `SECURITY_SLACK_WEBHOOK_URL` - Slack channel for security alerts

### AWS Credentials
- `AWS_ACCESS_KEY_ID` - AWS access key for deployments
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for deployments

### Staging Environment
- `STAGING_SSH_USER` - SSH username for staging server
- `STAGING_SSH_HOST` - Staging server hostname/IP

### Production Environment
- `PRODUCTION_SSH_USER` - SSH username for production server
- `PRODUCTION_SSH_HOST` - Production server hostname/IP

### Code Quality & Security
- `SONAR_TOKEN` - SonarQube authentication token
- `SONAR_HOST_URL` - SonarQube server URL (e.g., https://sonarcloud.io)
- `SNYK_TOKEN` - Snyk API token for vulnerability scanning
- `FOSSA_API_KEY` - FOSSA API key for license compliance

### Container Registry
- Automatically uses `GITHUB_TOKEN` for GitHub Container Registry (ghcr.io)

---

## Setup Instructions

### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT

# Verify workflow files
ls -la .github/workflows/
```

### 2. Configure Secrets

1. Navigate to GitHub repository
2. Go to **Settings** → **Secrets and Variables** → **Actions**
3. Add each secret listed above
4. Verify secrets are accessible in workflow runs

### 3. Configure Environments

1. Go to **Settings** → **Environments**
2. Create two environments:
   - `staging`
   - `production`
3. Add environment-specific secrets
4. Configure protection rules for production:
   - Required reviewers: 2
   - Deployment branches: `main` and tags only

### 4. Enable GitHub Actions

1. Go to **Actions** tab
2. Enable workflows if disabled
3. Verify all three workflows appear

### 5. Test CI Pipeline

```bash
# Create a feature branch
git checkout -b feature/test-ci

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: Validate CI pipeline"
git push origin feature/test-ci

# Create pull request and observe CI results
```

---

## Workflow Execution

### Manual Deployment to Staging

```bash
# Via GitHub UI:
1. Go to Actions → CD - Deploy to Environments
2. Click "Run workflow"
3. Select branch: main
4. Select environment: staging
5. Click "Run workflow"
```

### Manual Deployment to Production

```bash
# Via GitHub UI:
1. Create a GitHub release with semantic version tag (e.g., v11.4.4)
2. Production deployment triggers automatically
3. Monitor workflow progress in Actions tab

# OR manually trigger:
1. Go to Actions → CD - Deploy to Environments
2. Click "Run workflow"
3. Select branch: main
4. Select environment: production
5. Click "Run workflow"
```

### Security Scan

```bash
# Automatic: Runs on every push and daily at 2 AM UTC

# Manual trigger:
1. Go to Actions → Security - SAST, Dependency & Container Scanning
2. Click "Run workflow"
3. Select branch
4. Click "Run workflow"
```

---

## Monitoring & Troubleshooting

### View Workflow Logs

1. Go to **Actions** tab
2. Select the workflow run
3. Click on job to view logs
4. Download artifacts for detailed reports

### Common Issues

#### 1. Test Coverage Below 95%

**Symptom**: JaCoCo check fails in CI
**Solution**:
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw test jacoco:report
# Review target/site/jacoco/index.html
# Add missing tests
```

#### 2. Docker Build Fails

**Symptom**: Docker build job fails
**Solution**:
```bash
# Test locally
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean package -DskipTests
docker build -f src/main/docker/Dockerfile.jvm -t test .
```

#### 3. Deployment Health Check Fails

**Symptom**: Service doesn't become healthy after deployment
**Solution**:
```bash
# SSH to server
ssh user@staging-server

# Check logs
docker-compose -f docker-compose.staging.yml logs -f aurigraph-v11

# Verify service
curl http://localhost:9003/q/health
```

#### 4. Security Scan Finds Vulnerabilities

**Symptom**: Security pipeline fails
**Solution**:
1. Review SARIF reports in Security tab
2. Update vulnerable dependencies in pom.xml
3. Add suppressions to `.dependency-check-suppressions.xml` if false positive
4. Document decision in JIRA (AV11-XXX)

---

## Performance Benchmarks

### CI Pipeline Performance

| Job | Duration | Optimization |
|-----|----------|--------------|
| Build & Test (JVM) | 8-10 min | Maven caching |
| Build & Test (Native) | 12-15 min | GraalVM caching |
| Integration Tests | 5-7 min | TestContainers |
| Performance Tests | 8-10 min | JMH warmup |
| Docker Build | 5-7 min | Layer caching |
| SonarQube Scan | 8-10 min | Analysis caching |

**Total CI Duration**: 20-30 minutes (parallel execution)

### Deployment Performance

| Environment | Duration | Strategy |
|-------------|----------|----------|
| Staging | 10-15 min | Direct deployment |
| Production | 20-30 min | Blue-green |

---

## Quality Gates

### CI Pipeline

- ✅ Unit test pass rate: 100%
- ✅ Integration test pass rate: 100%
- ✅ Code coverage: ≥95% (lines), ≥90% (branches)
- ✅ Critical packages: crypto (≥98%), consensus (≥95%)
- ✅ SonarQube Quality Gate: Pass
- ✅ Performance baseline: 776K TPS

### Security Pipeline

- ✅ No secrets in codebase
- ✅ No high/critical CVEs (CVSS ≥7)
- ✅ No high-severity code vulnerabilities
- ✅ Container vulnerabilities: None (high/critical)
- ✅ License compliance: 100%
- ✅ IaC security: Pass

### Deployment Pipeline

- ✅ Health check: Responsive within 5 minutes
- ✅ Smoke tests: 100% pass
- ✅ Monitoring: Stable for 5 minutes (production)
- ✅ Rollback ready: Backup created

---

## Architecture

### CI/CD Flow

```
┌─────────────────┐
│   Code Push     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   CI Pipeline   │
│  - Build & Test │
│  - Integration  │
│  - Performance  │
│  - Quality Scan │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Security Scan   │
│  - SAST         │
│  - Dependencies │
│  - Containers   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Docker Registry │
│  ghcr.io        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deployment     │
│  - Staging      │
│  - Production   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Monitoring    │
│  - Health       │
│  - Metrics      │
└─────────────────┘
```

### Deployment Architecture

```
┌─────────────────────────────────────────┐
│          GitHub Actions Runner          │
│  - Build artifacts                      │
│  - Run tests                            │
│  - Security scans                       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  Container Registry │
         │  ghcr.io            │
         └──────────┬──────────┘
                    │
      ┌─────────────┴─────────────┐
      ▼                           ▼
┌───────────────┐        ┌───────────────┐
│    Staging    │        │  Production   │
│  Environment  │        │  Environment  │
│               │        │               │
│  - Auto       │        │  - Manual     │
│  - Main branch│        │  - Release tag│
│  - Health     │        │  - Blue-green │
│  - Smoke test │        │  - Rollback   │
└───────────────┘        └───────────────┘
```

---

## Maintenance

### Weekly Tasks

- ✅ Review security scan results
- ✅ Update dependency suppressions if needed
- ✅ Monitor CI/CD performance metrics
- ✅ Review failed workflow runs

### Monthly Tasks

- ✅ Update GitHub Actions versions
- ✅ Review and update secrets rotation
- ✅ Optimize cache strategies
- ✅ Update this documentation

### Quarterly Tasks

- ✅ Security audit of CI/CD pipeline
- ✅ Review deployment strategies
- ✅ Evaluate new security tools
- ✅ Update quality gate thresholds

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Quarkus CI/CD Guide](https://quarkus.io/guides/continuous-integration)
- [OWASP Dependency-Check](https://jeremylong.github.io/DependencyCheck/)
- [SonarQube Documentation](https://docs.sonarqube.org/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)

---

## Support

For issues or questions:

1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Create JIRA ticket: [AV11 Project](https://aurigraphdlt.atlassian.net/jira/software/projects/AV11)
4. Contact DevOps team via Slack: #aurigraph-devops

---

**Last Updated**: November 12, 2025
**Version**: 1.0.0
**Maintained by**: CI/CD Agent (Agent 1)
