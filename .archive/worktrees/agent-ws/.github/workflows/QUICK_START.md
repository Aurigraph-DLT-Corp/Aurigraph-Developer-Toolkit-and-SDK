# CI/CD Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Configure Secrets (Required)

Navigate to **Repository Settings → Secrets and Variables → Actions** and add:

#### Essential Secrets (Minimum to Run)
```bash
SONAR_TOKEN=<your_sonarqube_token>
SONAR_HOST_URL=https://sonarcloud.io
```

#### Optional Secrets (For Full Pipeline)
```bash
# Deployment
STAGING_SSH_USER=<username>
STAGING_SSH_HOST=<staging-server-ip>
PRODUCTION_SSH_USER=<username>
PRODUCTION_SSH_HOST=<production-server-ip>

# Security Scanning
SNYK_TOKEN=<snyk_api_token>
FOSSA_API_KEY=<fossa_api_key>

# Notifications
SLACK_WEBHOOK_URL=<slack_webhook_url>
SECURITY_SLACK_WEBHOOK_URL=<security_slack_webhook_url>

# AWS (if using AWS for deployments)
AWS_ACCESS_KEY_ID=<aws_key>
AWS_SECRET_ACCESS_KEY=<aws_secret>
```

### Step 2: Test CI Pipeline

```bash
# Create a test branch
git checkout -b test/ci-validation

# Make a small change
echo "# CI Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: Validate CI pipeline"
git push origin test/ci-validation

# Create PR and watch the pipeline run
```

### Step 3: Verify Workflows

Go to **Actions** tab and verify you see:
- ✅ CI - Build, Test & Quality
- ✅ CD - Deploy to Environments
- ✅ Security - SAST, Dependency & Container Scanning

---

## 🔧 Common Tasks

### Run All Tests Locally

```bash
cd aurigraph-av10-7/aurigraph-v11-standalone

# Unit tests
./mvnw test

# Integration tests
./mvnw verify

# Performance tests
./mvnw test -Pperformance-test

# Check coverage
./mvnw jacoco:report
open target/site/jacoco/index.html
```

### Build Native Image Locally

```bash
cd aurigraph-av10-7/aurigraph-v11-standalone

# Fast build (development)
./mvnw package -Pnative-fast

# Production build
./mvnw package -Pnative

# Run native executable
./target/aurigraph-v11-standalone-11.4.4-runner
```

### Deploy to Staging (Manual)

```bash
# Via GitHub UI:
1. Actions → "CD - Deploy to Environments"
2. "Run workflow"
3. Branch: main
4. Environment: staging
5. "Run workflow"

# Via CLI (requires gh CLI):
gh workflow run deploy.yml -f environment=staging
```

### Deploy to Production (Manual)

```bash
# Recommended: Create a release
1. Code → Releases → "Draft a new release"
2. Tag: v11.4.4 (semantic versioning)
3. Title: "Release v11.4.4"
4. Description: Release notes
5. "Publish release"
# Production deployment triggers automatically

# Alternative: Manual trigger
gh workflow run deploy.yml -f environment=production
```

### Run Security Scan (Manual)

```bash
# Via GitHub UI:
1. Actions → "Security - SAST, Dependency & Container Scanning"
2. "Run workflow"
3. Select branch
4. "Run workflow"

# Via CLI:
gh workflow run security.yml
```

---

## 📊 Pipeline Status

### Check Pipeline Status

```bash
# View recent workflow runs
gh run list

# View specific workflow status
gh run view <run-id>

# Watch workflow in real-time
gh run watch <run-id>

# Download logs
gh run download <run-id>
```

### View Test Coverage

1. Go to **Actions** → Select CI workflow run
2. Download artifact: `test-results-default`
3. Open `jacoco/index.html` in browser

### View Security Reports

1. Go to **Security** tab
2. View:
   - Code scanning alerts (CodeQL, Semgrep)
   - Dependabot alerts
   - Secret scanning alerts

---

## 🐛 Troubleshooting

### CI Pipeline Fails

**Problem**: Build or tests fail
```bash
# Run locally first
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean verify

# Check specific test
./mvnw test -Dtest=SpecificTest

# View detailed logs in GitHub Actions
```

**Problem**: Coverage below 95%
```bash
# Generate coverage report
./mvnw jacoco:report

# Open report
open target/site/jacoco/index.html

# Add missing tests for uncovered code
```

### Deployment Fails

**Problem**: Health check timeout
```bash
# SSH to server
ssh user@server

# Check service logs
docker-compose logs -f aurigraph-v11

# Manual health check
curl http://localhost:9003/q/health

# Restart service
docker-compose restart aurigraph-v11
```

**Problem**: Rollback needed
```bash
# Automatic rollback triggers on deployment failure
# Manual rollback if needed:
ssh user@server
cd /opt/aurigraph/production
./scripts/rollback.sh
```

### Security Scan Fails

**Problem**: Dependency vulnerability found
```bash
# Review vulnerability
# Check OWASP Dependency-Check report in artifacts

# Update dependency in pom.xml
<dependency>
    <groupId>org.example</groupId>
    <artifactId>vulnerable-lib</artifactId>
    <version>NEW_VERSION</version> <!-- Updated -->
</dependency>

# If false positive, add suppression
# Edit: .dependency-check-suppressions.xml
```

**Problem**: Secret detected
```bash
# Remove secret from code
# Rotate exposed credentials immediately
# Add pattern to .gitignore

# Remove from git history (if needed)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 📈 Performance Targets

### CI Pipeline
- ⏱️ **Total Duration**: 20-30 minutes (parallel)
- ✅ **Test Coverage**: ≥95% lines, ≥90% branches
- ✅ **Performance Baseline**: 776K TPS
- ✅ **Quality Gate**: Pass

### Deployment
- ⏱️ **Staging**: 10-15 minutes
- ⏱️ **Production**: 20-30 minutes (blue-green)
- ✅ **Downtime**: Zero (production)
- ✅ **Rollback**: <5 minutes

### Security
- ⏱️ **Full Scan**: 30-40 minutes
- ✅ **Daily Automated Scan**: 2 AM UTC
- ✅ **CVE Response**: <24 hours
- ✅ **Zero High/Critical**: Enforced

---

## 🔍 Monitoring

### Key Metrics to Monitor

1. **CI Health**
   - Build success rate: >95%
   - Test pass rate: 100%
   - Average build time: <30 min
   - Cache hit rate: >80%

2. **Deployment Success**
   - Deployment success rate: >95%
   - Rollback rate: <5%
   - Production incidents: 0
   - MTTR (Mean Time to Recovery): <15 min

3. **Security Posture**
   - High/Critical CVEs: 0
   - Secret leaks: 0
   - Container vulnerabilities: 0
   - License violations: 0

### Dashboards

- **GitHub Actions**: Actions tab for workflow history
- **Security**: Security tab for vulnerability reports
- **Insights**: Insights → Security for trends
- **Artifacts**: Download detailed reports from workflow runs

---

## 📚 Cheat Sheet

```bash
# Local Development
./mvnw quarkus:dev                    # Dev mode with hot reload
./mvnw test                           # Run unit tests
./mvnw verify                         # Run all tests
./mvnw jacoco:report                  # Generate coverage report
./mvnw package -Pnative-fast          # Fast native build

# GitHub CLI
gh workflow list                      # List workflows
gh run list                           # List recent runs
gh run watch                          # Watch latest run
gh workflow run ci.yml                # Trigger CI
gh workflow run deploy.yml -f environment=staging

# Docker
docker build -f src/main/docker/Dockerfile.jvm -t v11 .
docker run -p 9003:9003 v11
docker-compose up -d
docker-compose logs -f

# Health Checks
curl http://localhost:9003/q/health
curl http://localhost:9003/q/metrics
curl http://localhost:9003/api/v11/info
```

---

## 🎯 Success Checklist

### Before Merging PR
- [ ] All CI checks pass (green checkmark)
- [ ] Code coverage ≥95%
- [ ] Security scan passes
- [ ] PR approved by 2 reviewers
- [ ] No merge conflicts

### Before Deploying to Staging
- [ ] All tests pass on main branch
- [ ] Docker image built successfully
- [ ] Release notes prepared
- [ ] Team notified

### Before Deploying to Production
- [ ] Staging deployment successful
- [ ] Smoke tests pass on staging
- [ ] Release tag created (semantic version)
- [ ] Backup verified
- [ ] Rollback plan ready
- [ ] Team on standby

---

## 🆘 Emergency Procedures

### Production Down

1. **Check status**
   ```bash
   curl https://dlt.aurigraph.io/q/health
   ```

2. **View logs**
   ```bash
   gh run list --workflow=deploy.yml
   gh run view <latest-run-id>
   ```

3. **Trigger rollback**
   - Automatic rollback should trigger on deployment failure
   - Monitor rollback job in Actions tab
   - Verify service recovery

4. **Manual intervention** (if automatic rollback fails)
   ```bash
   ssh user@production-server
   cd /opt/aurigraph/production
   ./scripts/emergency-rollback.sh
   ```

### Security Incident

1. **Disable vulnerable service immediately**
2. **Rotate exposed credentials**
3. **Notify security team**: `#security-incidents` Slack channel
4. **Create incident ticket**: JIRA (AV11-SEC-XXX)
5. **Follow incident response plan**

---

## 📞 Support

- **DevOps Team**: #aurigraph-devops (Slack)
- **Security Team**: #aurigraph-security (Slack)
- **JIRA**: https://aurigraphdlt.atlassian.net/browse/AV11
- **Documentation**: `.github/workflows/README.md`

---

**Quick Reference Version**: 1.0.0
**Last Updated**: November 12, 2025
