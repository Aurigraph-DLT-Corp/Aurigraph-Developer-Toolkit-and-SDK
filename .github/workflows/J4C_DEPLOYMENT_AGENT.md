# J4C Deployment Agent - Memorized Deployment Process

## Core Deployment Principles - #MEMORIZED

### 1. INCREMENTAL DEPLOYMENT ONLY
**CRITICAL**: Only deploy changed components. Never reinstall infrastructure on every deployment.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INCREMENTAL DEPLOYMENT FLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Git Push] → [Change Detection] → [Deploy ONLY Changed Components] │
│                      │                                               │
│         ┌───────────┼───────────────┬─────────────────┐             │
│         ▼           ▼               ▼                 ▼             │
│    [Backend?]   [Portal?]      [Config?]         [Nodes?]          │
│    Changed?     Changed?       Changed?          Changed?          │
│         │           │               │                 │             │
│      Y/N ↓       Y/N ↓          Y/N ↓             Y/N ↓            │
│    [Build &    [Build &       [Reload          [Restart           │
│     Deploy]     Deploy]        Config]          Nodes]            │
│                                                                     │
│  Infrastructure (PostgreSQL, Redis, NGINX) = NO CHANGE NEEDED      │
│  unless explicitly modified                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Rules:**
- Backend changes → Rebuild & deploy backend JAR only
- Portal changes → Rebuild & deploy frontend only
- Config changes → Reload configuration only
- Infrastructure → NEVER redeploy unless explicitly required
- Database → NEVER reinitialize unless schema changes

### 2. Component Change Detection
The CI/CD workflow uses `detect-changes` job to identify what changed:
- `backend_changed`: V11 standalone Java code
- `portal_changed`: Enterprise portal React code
- `nodes_changed`: Validator/node configurations
- `config_changed`: Application configuration files
- `docker_changed`: Docker-related files

### 3. Skip Unnecessary Work
```yaml
# Example: Skip backend build if no backend changes
build-backend:
  if: ${{ needs.detect-changes.outputs.backend_changed == 'true' }}
```

### 4. POST-DEPLOYMENT E2E/SMOKE TESTS - #MEMORIZED
**CRITICAL**: Execute E2E and Smoke tests after EVERY deployment. This is MANDATORY.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    POST-DEPLOYMENT QAQC FLOW                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Deployment Complete] → [Health Check] → [QAQC Agent Triggered]   │
│                                                │                    │
│                         ┌──────────────────────┴─────────────────┐  │
│                         │                                        │  │
│                         ▼                                        ▼  │
│                   [Smoke Tests]                          [E2E Tests] │
│                   Quick validation                       Full suite │
│                   ~30 seconds                            ~5 minutes │
│                         │                                        │  │
│                         └──────────────────────┬─────────────────┘  │
│                                                │                    │
│                                                ▼                    │
│                                    [Test Report Generated]         │
│                                    Pass → Done                      │
│                                    Fail → Alert + Rollback Option  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**QAQC Agent Responsibilities:**
1. **Smoke Tests** (immediate, ~30s):
   - Health endpoint check: `curl https://dlt.aurigraph.io/api/v11/health`
   - Info endpoint check: `curl https://dlt.aurigraph.io/api/v11/info`
   - Frontend accessibility: `curl https://dlt.aurigraph.io`

2. **E2E Tests** (comprehensive, ~5min):
   - Playwright Frontend Tests: 76 tests
   - Pytest Backend Tests: 75 tests
   - Total: 151 tests

3. **Test Failure Handling** - #MEMORIZED:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │              TEST ESCALATION FLOW                           │
   ├─────────────────────────────────────────────────────────────┤
   │                                                             │
   │  [Smoke Tests] ──PASS──> Done ✅                            │
   │       │                                                     │
   │      FAIL                                                   │
   │       │                                                     │
   │       ▼                                                     │
   │  [Run E2E Tests] ← Diagnose specific failures               │
   │       │                                                     │
   │       ├──PASS──> Smoke false positive, verify manually      │
   │       │                                                     │
   │      FAIL                                                   │
   │       │                                                     │
   │       ▼                                                     │
   │  [Generate Failure Report]                                  │
   │       │                                                     │
   │       ├──> Document in JIRA                                 │
   │       ├──> Alert team                                       │
   │       └──> Consider rollback                                │
   │                                                             │
   └─────────────────────────────────────────────────────────────┘
   ```

   **RULE: If Smoke Tests FAIL → Run E2E Tests for diagnosis**
   - Smoke tests are quick but give limited info
   - E2E tests identify EXACTLY what's broken
   - Never skip E2E when smoke fails

**Quick Smoke Test Command:**
```bash
# Run immediately after deployment
curl -sf https://dlt.aurigraph.io/api/v11/health && \
curl -sf https://dlt.aurigraph.io/api/v11/info && \
curl -sf https://dlt.aurigraph.io/ | head -c 100 && \
echo "✅ Smoke tests passed"
```

---

## Remote Server Configuration
- **Server**: dlt.aurigraph.io
- **SSH Port**: 22 (Standard SSH, NOT 2235)
- **User**: subbu
- **App Port**: 9003
- **JAR Location**: /home/subbu/aurigraph-v12.jar
- **Log Location**: /home/subbu/aurigraph/logs/main-api.log

## Database Configuration
- **Type**: PostgreSQL
- **Host**: localhost:5432
- **Database**: j4c_db
- **User**: j4c_user
- **Password**: j4c_password

## CI/CD Workflow Configuration

### Workflow: ssh-deploy.yml
```yaml
runs-on: [self-hosted, linux, aurigraph]  # Uses self-hosted runners
```

### Triggers
1. **Auto-trigger on push** to V12 or main branches when:
   - `aurigraph-av10-7/aurigraph-v11-standalone/src/**` changes
   - `aurigraph-av10-7/aurigraph-v11-standalone/pom.xml` changes
   - `.github/workflows/ssh-deploy.yml` changes

2. **Manual trigger** via `workflow_dispatch`:
   - Option: `skip_build` - Deploy existing JAR without rebuilding

### Build Process
1. Checkout code
2. Set up JDK 21 (Temurin distribution)
3. Build with Maven: `./mvnw clean package -DskipTests -B`
4. Output: `target/*-runner.jar`

### Deployment Steps
1. **Setup SSH**: Uses `PROD_SSH_PRIVATE_KEY` secret
2. **Upload JAR**: `scp -P 22 <JAR> subbu@dlt.aurigraph.io:/home/subbu/aurigraph-v12.jar`
3. **Deploy Script**:
   - Stop existing process: `pkill -f 'aurigraph-v12.jar'`
   - Verify port 9003 is free
   - Start new service with JVM flags
4. **Health Check**: Verify `/api/v11/health` responds

### JVM Configuration for Production
```bash
java -Xmx8g -Xms4g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -Dquarkus.http.port=9003 \
  -Dquarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/j4c_db \
  -Dquarkus.datasource.username=j4c_user \
  -Dquarkus.datasource.password=j4c_password \
  -Dquarkus.flyway.migrate-at-start=false \
  -jar aurigraph-v12.jar
```

## Required GitHub Secrets
- `PROD_SSH_PRIVATE_KEY` - SSH private key for subbu@dlt.aurigraph.io

## Deployment Commands (Manual)

### Check Server Status
```bash
curl -sf https://dlt.aurigraph.io/api/v11/health
```

### Trigger Deployment
```bash
# Via Git push
git add -A && git commit -m "feat: description" && git push origin V12

# Via GitHub CLI
gh workflow run ssh-deploy.yml --ref V12
```

### Check Workflow Status
```bash
gh run list --repo Aurigraph-DLT-Corp/Aurigraph-DLT --limit 5
```

## Important Notes
1. **NEVER use local deployment** - Always use CI/CD via GitHub Actions
2. **Self-hosted runners** - Workflows use `[self-hosted, linux, aurigraph]` labels
3. **No Flyway migrations at startup** - `migrate-at-start=false`
4. **Health endpoint**: `/api/v11/health`
5. **Log monitoring**: Check `/home/subbu/aurigraph/logs/main-api.log`

## Post-Deployment E2E Testing (MANDATORY)

**IMPORTANT**: Run E2E testing with Playwright and Pytest after EVERY deployment to remote server.

### Automated E2E Testing Steps

After successful deployment and health check, execute:

```bash
# 1. Run Playwright E2E Tests (Frontend - 76 tests)
cd enterprise-portal/enterprise-portal/frontend
npx playwright test --reporter=list

# 2. Run Pytest Backend Tests (FastAPI - 75 tests)
cd aurigraph-fastapi
python3 -m pytest tests/ -v --tb=short

# 3. Quick Health Verification
curl -s https://dlt.aurigraph.io/api/v11/health | jq .
curl -s https://dlt.aurigraph.io/api/v11/info | jq .
```

### Test Suite Summary (December 2025)

| Test Type | Framework | Tests | Location |
|-----------|-----------|-------|----------|
| E2E Frontend | Playwright | 76 tests | `enterprise-portal/.../tests/e2e/` |
| Backend API | Pytest | 75 tests | `aurigraph-fastapi/tests/` |
| **Total** | - | **151 tests** | - |

### CI/CD Integration

Add to GitHub Actions workflow after deployment:
```yaml
- name: Run E2E Tests
  run: |
    cd enterprise-portal/enterprise-portal/frontend
    npx playwright test --reporter=list

- name: Run Backend Tests
  run: |
    cd aurigraph-fastapi
    python3 -m pytest tests/ -v
```

### Test Failure Handling
- If E2E tests fail: Check frontend deployment and API connectivity
- If Pytest fails: Check backend API endpoints and database
- Document failures in JIRA for tracking

## Troubleshooting

### If deployment fails:
1. Check workflow logs: `gh run view <run-id>`
2. SSH to server: `ssh -p 22 subbu@dlt.aurigraph.io`
3. Check logs: `tail -f /home/subbu/aurigraph/logs/main-api.log`
4. Check process: `ps aux | grep aurigraph`
5. Check port: `ss -tlnp | grep 9003`

### If health check fails:
1. Wait 30-60 seconds for startup
2. Check Java process is running
3. Verify database connectivity
4. Check application logs for errors

### If E2E tests fail:
1. Check Playwright report: `npx playwright show-report`
2. Verify frontend is accessible: `curl https://dlt.aurigraph.io`
3. Check browser console for errors
4. Review test screenshots in `test-results/` folder

---

## GitHub Actions Runner Strategy - #MEMORIZED

### Primary Strategy: Try GitHub Actions First, Fallback to Self-Hosted

```
┌─────────────────────────────────────────────────────────────────────┐
│              RUNNER FALLBACK STRATEGY - #MEMORIZED                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Deployment Triggered]                                             │
│         │                                                           │
│         ▼                                                           │
│  [Try GitHub-Hosted Runners]                                        │
│         │                                                           │
│    ┌────┴────┐                                                      │
│    │ Success │─────────────────────────▶ ✅ Done                    │
│    └────┬────┘                                                      │
│         │ Fail (Budget/Quota)                                       │
│         ▼                                                           │
│  [Switch to Self-Hosted Runner]                                     │
│         │                                                           │
│         ▼                                                           │
│  [self-hosted-cicd.yml] ◀─── Primary V12 deployment workflow        │
│         │                                                           │
│         ▼                                                           │
│  ✅ Deployment Complete                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### When GitHub Actions Budget Exhausted:
1. **Automatic Fallback**: `self-hosted-cicd.yml` uses self-hosted runners
2. **No SSH Keys Needed**: Runner has direct filesystem access
3. **Better Performance**: Native deployment on production server

### Active Workflow Configuration (December 2025):

| Workflow | Runner Type | Status | Trigger |
|----------|-------------|--------|---------|
| `self-hosted-cicd.yml` | Self-hosted | ✅ Active | Push to V12/main |
| `aurigraph-unified-cicd.yml` | GitHub-hosted | ⏸️ Manual only | workflow_dispatch |
| `deploy-fullstack.yml` | GitHub-hosted | ⏸️ Manual only | workflow_dispatch |

### Self-Hosted Runner Labels:
```yaml
runs-on: [self-hosted, Linux, aurigraph-prod]
```

### Quick Deployment Commands:
```bash
# Check runner status
gh run list --limit 5

# Manual trigger self-hosted workflow
gh workflow run self-hosted-cicd.yml --ref V12

# View running workflow
gh run watch
```

### Cost-Saving Benefits:
- Self-hosted runners = $0 GitHub Actions minutes
- Direct server access = faster deployments
- No artifact transfers = reduced complexity
