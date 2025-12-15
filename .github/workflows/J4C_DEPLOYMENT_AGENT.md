# J4C Deployment Agent - Memorized Deployment Process

## Agent Role & Responsibilities - #MEMORIZED

### Primary Role
**J4C (Jeeves for Coder) Deployment Agent** is an autonomous CI/CD orchestrator that:
- Manages V12 Aurigraph DLT deployments using self-hosted runners
- Coordinates multi-agent parallel deployments
- Executes QAQC verification with smart test escalation
- Integrates with JIRA for deployment tracking

### Agent Capabilities

| Capability | Description |
|------------|-------------|
| **Deployment Orchestration** | Coordinates backend, frontend, and node deployments |
| **Self-Hosted Runner Management** | Uses local runners to avoid GitHub Actions budget |
| **SPARC Framework Execution** | Specification → Pseudocode → Architecture → Refinement → Completion |
| **QAQC Verification** | Smoke tests → E2E tests (on failure) |
| **JIRA Integration** | Auto-update tickets on deployment events |
| **Node Management** | Deploy validator, business, slim nodes with GraalVM |
| **Progress Visualization** | Display real-time deployment progress bars |

### Progress Bar Templates - #MEMORIZED

**ALWAYS show progress bars during deployment. Use these templates:**

```
┌──────────────────────────────────────────────────────────────┐
│  V12 Self-Hosted Deployment                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [████████████████████████████████████████]  100% ✅        │
│                                                              │
│  ✓ Set up job                                                │
│  ✓ Checkout code                                             │
│  ✓ Set up JDK 21 / Node.js                                   │
│  ✓ Get version info                                          │
│  ✓ Build application                                         │
│  ✓ Pre-deployment checks                                     │
│  ✓ Create backup                                             │
│  ✓ Deploy application                                        │
│  ✓ Health check                                              │
│                                                              │
│  Server: https://dlt.aurigraph.io                            │
│  Version: 12.0.0                                             │
│  Status: UP                                                  │
└──────────────────────────────────────────────────────────────┘
```

**Progress States:**
```
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]   0%  Starting
[████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  10%  Checkout
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  20%  Setup
[████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  30%  Building
[████████████████████░░░░░░░░░░░░░░░░░░░░]  50%  Compiling
[████████████████████████████░░░░░░░░░░░░]  70%  Deploying
[████████████████████████████████████░░░░]  90%  Health Check
[████████████████████████████████████████] 100%  ✅ Complete
```

**Step Indicators:**
- `✓` = Completed
- `▶` or `*` = In Progress
- `○` or `-` = Pending
- `X` = Failed

### Activation Triggers
- **Automatic**: Push to V12/main branch (code changes)
- **Manual**: `gh workflow run self-hosted-cicd.yml --ref V12`
- **Skip Tests**: `-f skip_tests=true` for faster deployments

### Target Environment
- **Server**: dlt.aurigraph.io
- **SSH Port**: 22 (Standard SSH - UPDATED from 2235)
- **App Port**: 9003
- **Health**: https://dlt.aurigraph.io/api/v11/health

---

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
- **Docker JAR Location**: /home/subbu/aurigraph-v12/aurigraph-v12.jar (SYMLINK)
- **Log Location**: /home/subbu/aurigraph/logs/main-api.log

## CRITICAL: JAR Path Synchronization - #MEMORIZED

**PROBLEM**: Docker containers mount from `/home/subbu/aurigraph-v12/` but CI/CD deploys to `/home/subbu/aurigraph-v12.jar`

**SOLUTION**: Use symlink to ensure both paths point to the same JAR file.

### JAR Path Architecture
```
CI/CD deploys here ─────────┐
                            ▼
               /home/subbu/aurigraph-v12.jar (MAIN JAR)
                            ▲
                            │ (symlink)
Docker containers ─────────┘
read from here:  /home/subbu/aurigraph-v12/aurigraph-v12.jar
```

### Setup Symlink (Run once on server)
```bash
mkdir -p /home/subbu/aurigraph-v12
ln -sf /home/subbu/aurigraph-v12.jar /home/subbu/aurigraph-v12/aurigraph-v12.jar
```

### Post-Deployment Container Restart - #MEMORIZED
After every deployment, restart Docker containers to reload the JAR:
```bash
docker restart aurigraph-validator-1 aurigraph-validator-2 aurigraph-validator-3 \
               aurigraph-validator-4 aurigraph-validator-5 \
               aurigraph-business-1 aurigraph-business-2 aurigraph-business-3 \
               aurigraph-ei-1 aurigraph-ei-2 aurigraph-ei-3
```

### Why Container Restart is Required
- Java caches loaded classes in memory
- File change on disk is NOT automatically detected
- Containers MUST be restarted to load new JAR

### Verification Commands
```bash
# Check symlink exists
ls -la /home/subbu/aurigraph-v12/aurigraph-v12.jar

# Should show: aurigraph-v12.jar -> /home/subbu/aurigraph-v12.jar

# Verify both point to same file
stat /home/subbu/aurigraph-v12.jar
stat /home/subbu/aurigraph-v12/aurigraph-v12.jar
```

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

---

## SPARC Multi-Agent Deployment Plan - #MEMORIZED

### SPARC Framework Overview
**S**pecification → **P**seudocode → **A**rchitecture → **R**efinement → **C**ompletion

### Multi-Agent Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SPARC MULTI-AGENT DEPLOYMENT FLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Git Push to V12]                                                          │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    J4C DEPLOYMENT AGENTS (Parallel)                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │   [J4C Agent 1]          [J4C Agent 2]          [J4C Agent 3]      │   │
│  │   Backend Deploy         Frontend Deploy        Config Update       │   │
│  │        │                      │                      │              │   │
│  │        └──────────────────────┴──────────────────────┘              │   │
│  │                               │                                     │   │
│  │                               ▼                                     │   │
│  │                    [All Deployments Complete]                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    QAQC AGENTS (Sequential)                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │   [QAQC Agent: Smoke Test]                                         │   │
│  │        │                                                            │   │
│  │   ┌────┴────┐                                                       │   │
│  │   │  PASS   │───────────────────────────▶ ✅ Deployment Success    │   │
│  │   └────┬────┘                                                       │   │
│  │        │ FAIL                                                       │   │
│  │        ▼                                                            │   │
│  │   [QAQC Agent: E2E Tests]  ◀── Automatic fallback                  │   │
│  │        │                                                            │   │
│  │   ┌────┴────┐                                                       │   │
│  │   │  PASS   │───────────────────────────▶ ✅ Deployment Success    │   │
│  │   └────┬────┘                             (Smoke false positive)    │   │
│  │        │ FAIL                                                       │   │
│  │        ▼                                                            │   │
│  │   [Alert + Rollback Option]                                        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### J4C Deployment Agents Configuration

| Agent | Role | Runs On | Parallel |
|-------|------|---------|----------|
| J4C-Backend | Build & deploy Java/Quarkus | Self-hosted | Yes |
| J4C-Frontend | Build & deploy React portal | Self-hosted | Yes |
| J4C-Config | Update configs & nginx | Self-hosted | Yes |

### QAQC Agents Configuration

| Agent | Type | Duration | Trigger |
|-------|------|----------|---------|
| QAQC-Smoke | Health/endpoint checks | ~30 sec | After all J4C agents |
| QAQC-E2E | Playwright + Pytest | ~5 min | Only if smoke fails |

### Agent Execution Commands

```bash
# Deploy with all J4C agents (parallel)
gh workflow run self-hosted-cicd.yml --ref V12 \
  -f deploy_backend=true \
  -f deploy_frontend=true

# Manual QAQC smoke test
curl -sf https://dlt.aurigraph.io/api/v11/health && \
curl -sf https://dlt.aurigraph.io/api/v11/info && \
curl -sf https://dlt.aurigraph.io/ | head -c 100 && \
echo "✅ Smoke tests passed"

# If smoke fails → Run E2E tests
cd enterprise-portal/enterprise-portal/frontend && npx playwright test
cd aurigraph-fastapi && python3 -m pytest tests/ -v
```

### SPARC Phases for Each Deployment

1. **Specification**: Detect changed components (backend/frontend/config)
2. **Pseudocode**: Generate deployment steps based on changes
3. **Architecture**: Select appropriate J4C agents
4. **Refinement**: Execute parallel deployments
5. **Completion**: Run QAQC agents for verification

### Multi-Agent Benefits
- **Parallel Deployment**: Backend + Frontend deploy simultaneously
- **Automatic Verification**: QAQC agents run post-deployment
- **Smart Fallback**: Smoke → E2E escalation on failure
- **Cost Efficient**: Self-hosted runners = $0

---

## Post-Deployment JIRA Updates - #MEMORIZED

### Automatic JIRA Update Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    JIRA UPDATE AFTER DEPLOYMENT                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Deployment Complete] → [QAQC Pass] → [Update JIRA]               │
│                                              │                      │
│                         ┌────────────────────┼────────────────────┐ │
│                         │                    │                    │ │
│                         ▼                    ▼                    ▼ │
│               [Add Deploy Comment]  [Update Status]  [Link Commit] │
│                         │                    │                    │ │
│                         └────────────────────┴────────────────────┘ │
│                                              │                      │
│                                              ▼                      │
│                                    [Notify Stakeholders]            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### JIRA Update Commands

```bash
# Get JIRA credentials (from Credentials.md)
JIRA_URL="https://aurigraphdlt.atlassian.net"
JIRA_USER="sjoish12@gmail.com"
JIRA_PROJECT="AV11"

# Add deployment comment to ticket
curl -X POST "$JIRA_URL/rest/api/3/issue/AV11-XXX/comment" \
  -H "Content-Type: application/json" \
  -u "$JIRA_USER:$JIRA_API_TOKEN" \
  -d '{
    "body": {
      "type": "doc",
      "version": 1,
      "content": [{
        "type": "paragraph",
        "content": [{
          "type": "text",
          "text": "✅ Deployed to production via self-hosted runner"
        }]
      }]
    }
  }'

# Transition ticket to "Done" (transition ID may vary)
curl -X POST "$JIRA_URL/rest/api/3/issue/AV11-XXX/transitions" \
  -H "Content-Type: application/json" \
  -u "$JIRA_USER:$JIRA_API_TOKEN" \
  -d '{"transition": {"id": "31"}}'
```

### JIRA Update Triggers
| Event | JIRA Action |
|-------|-------------|
| Deployment Success | Add comment + transition to "Done" |
| Smoke Test Pass | Add verification comment |
| E2E Test Pass | Add full test report |
| Deployment Fail | Add error comment + keep "In Progress" |

### GitHub-JIRA Integration
- Commits with `AV11-XXX` auto-link to JIRA
- PR merges update linked tickets
- Deployment status posted as comments

---

## J4C Node Deployment Agent - #MEMORIZED

### Node Types and Container Configuration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    J4C NODE DEPLOYMENT AGENT                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Check Node Status]                                                        │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              NODE TYPES (Quarkus/GraalVM Optimized)                  │   │
│  ├──────────────────┬──────────────────┬───────────────────────────────┤   │
│  │                  │                  │                               │   │
│  │  [Validator]     │  [Business]      │  [Slim Node]                 │   │
│  │  Full consensus  │  Smart contracts │  Light client                │   │
│  │  Heavy compute   │  Business logic  │  Minimal footprint           │   │
│  │                  │                  │                               │   │
│  │  Container:      │  Container:      │  Container:                  │   │
│  │  aurigraph-      │  aurigraph-      │  aurigraph-                  │   │
│  │  validator:v12   │  business:v12    │  slim:v12                    │   │
│  │                  │                  │                               │   │
│  │  Resources:      │  Resources:      │  Resources:                  │   │
│  │  4GB RAM, 2 CPU  │  2GB RAM, 1 CPU  │  512MB RAM, 0.5 CPU         │   │
│  │                  │                  │                               │   │
│  └──────────────────┴──────────────────┴───────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Node Deployment Decision Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NODE DEPLOYMENT DECISION TREE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [J4C Node Agent Start]                                                     │
│         │                                                                   │
│         ▼                                                                   │
│  [Check if nodes are running]                                               │
│         │                                                                   │
│    ┌────┴────┐                                                              │
│    │ Running │───▶ [Check if optimally deployed]                           │
│    └────┬────┘              │                                               │
│         │                   ├──Yes──▶ ✅ Skip deployment                    │
│    Not Running              │                                               │
│         │                   └──No───▶ [Redeploy with optimization]         │
│         ▼                                                                   │
│  [Deploy fresh containers]                                                  │
│         │                                                                   │
│         ▼                                                                   │
│  [Verify Quarkus/GraalVM native]                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ✅ Node deployment complete                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Optimal Deployment Checks

| Check | Validator | Business | Slim |
|-------|-----------|----------|------|
| GraalVM Native Image | Required | Required | Required |
| Quarkus Runtime | Native | Native | Native |
| Memory Limit | 4GB | 2GB | 512MB |
| CPU Limit | 2 cores | 1 core | 0.5 core |
| Health Endpoint | /health | /health | /health |
| gRPC Port | 9001 | 9002 | 9004 |
| HTTP Port | 9003 | 9013 | 9023 |

### Docker Compose Configuration

```yaml
# docker-compose.nodes.yml
version: '3.8'
services:
  validator-node:
    image: ghcr.io/aurigraph-dlt-corp/aurigraph-validator:v12
    container_name: aurigraph-validator
    build:
      context: .
      dockerfile: Dockerfile.native  # GraalVM native build
    environment:
      - QUARKUS_PROFILE=validator
      - JAVA_OPTS=-Xmx4g
    ports:
      - "9001:9001"  # gRPC
      - "9003:9003"  # HTTP
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9003/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  business-node:
    image: ghcr.io/aurigraph-dlt-corp/aurigraph-business:v12
    container_name: aurigraph-business
    environment:
      - QUARKUS_PROFILE=business
      - JAVA_OPTS=-Xmx2g
    ports:
      - "9002:9002"  # gRPC
      - "9013:9013"  # HTTP
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1'

  slim-node:
    image: ghcr.io/aurigraph-dlt-corp/aurigraph-slim:v12
    container_name: aurigraph-slim
    environment:
      - QUARKUS_PROFILE=slim
      - JAVA_OPTS=-Xmx512m
    ports:
      - "9004:9004"  # gRPC
      - "9023:9023"  # HTTP
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### Node Deployment Commands

```bash
# Check current node status
docker ps --filter "name=aurigraph" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check if using GraalVM native
docker exec aurigraph-validator java -version 2>&1 | grep -i graal

# Deploy all nodes
docker-compose -f docker-compose.nodes.yml up -d

# Deploy specific node
docker-compose -f docker-compose.nodes.yml up -d validator-node

# Verify optimal deployment
curl -s http://localhost:9003/health | jq '.checks'
curl -s http://localhost:9013/health | jq '.checks'
curl -s http://localhost:9023/health | jq '.checks'

# Build native images (requires GraalVM)
./mvnw package -Pnative -DskipTests
```

### GraalVM Native Build Configuration

```xml
<!-- pom.xml native profile -->
<profile>
  <id>native</id>
  <properties>
    <quarkus.package.type>native</quarkus.package.type>
    <quarkus.native.container-build>true</quarkus.native.container-build>
  </properties>
</profile>
```

### Node Optimization Benefits
- **Validator**: Full consensus with native performance
- **Business**: Smart contract execution optimized
- **Slim**: Minimal footprint for light operations
- **All**: 10x faster startup, 5x less memory with GraalVM native

---

## Infrastructure Improvements - #MEMORIZED (December 2025)

### 1. Nginx Upstream Load Balancing

**Configuration File**: `/etc/nginx/conf.d/upstream-backend.conf`

```nginx
# Primary pool - healthy containers with high weight
upstream aurigraph_v12_primary {
    server 127.0.0.1:19029 weight=3 max_fails=2 fail_timeout=10s;  # business-19
    server 127.0.0.1:19027 weight=3 max_fails=2 fail_timeout=10s;  # business-17
    keepalive 32;
}

# Secondary pool - failover containers
upstream aurigraph_v12_secondary {
    server 127.0.0.1:19011 weight=1 max_fails=3 fail_timeout=15s backup;
    server 127.0.0.1:19012 weight=1 max_fails=3 fail_timeout=15s backup;
    keepalive 16;
}
```

**Nginx Main Config Update** (`/etc/nginx/nginx.conf`):
```nginx
location /api/ {
    proxy_pass http://aurigraph_v12_primary;
    proxy_next_upstream error timeout http_502 http_503;
    proxy_connect_timeout 5s;
    proxy_read_timeout 30s;
}
```

### 2. Blue-Green Deployment Script

**Script Location**: `/home/subbu/scripts/blue-green-deploy.sh`

```bash
#!/bin/bash
# Zero-downtime deployment with blue-green strategy
# Usage: ./blue-green-deploy.sh [new-jar-path]

# Deployment Steps:
# 1. Copy new JAR to shared location
# 2. Identify current BLUE pool (active containers)
# 3. Start GREEN pool (new containers) with new JAR
# 4. Health check GREEN pool
# 5. Switch nginx upstream to GREEN pool
# 6. Drain BLUE pool connections
# 7. Stop BLUE pool containers
```

### 3. Container Manager Script

**Script Location**: `/home/subbu/scripts/container-manager.sh`

**Commands**:
```bash
# Check container status
./container-manager.sh status

# Restart all containers
./container-manager.sh restart-all

# Restart specific number of containers
./container-manager.sh restart 5

# Fix unhealthy containers (OOM recovery)
./container-manager.sh fix-unhealthy

# Deploy with optimized settings
./container-manager.sh deploy-opt
```

### 4. Optimized Container Configuration

**Container Port Mapping**: Ports 19011-19030 (business containers)

**JVM Memory Optimization** (`docker-compose-business-optimized.yml`):
```yaml
environment:
  JAVA_OPTS: >-
    -Xmx1200m -Xms512m
    -XX:+UseG1GC
    -XX:MaxGCPauseMillis=100
    -XX:+UseContainerSupport
    -XX:MaxRAMPercentage=60.0
    -XX:+HeapDumpOnOutOfMemoryError
  QUARKUS_DATASOURCE_JDBC_MAX_SIZE: "5"
  QUARKUS_DATASOURCE_JDBC_MIN_SIZE: "1"
deploy:
  resources:
    limits:
      memory: 2G
    reservations:
      memory: 512M
```

**Key Settings**:
| Setting | Value | Purpose |
|---------|-------|---------|
| Memory Limit | 2GB | Prevent OOM (up from 1.5GB) |
| JVM Heap Max | 1200MB | Explicit heap to prevent runaway |
| JVM Heap Min | 512MB | Fast startup |
| DB Pool Max | 5 | Reduce connection exhaustion |
| GC | G1GC | Low pause times |

### 5. Common Container Issues & Fixes

**Issue**: OutOfMemoryError from database connection pool
**Root Cause**: Default JVM heap consumes all container memory
**Fix**: Set explicit `-Xmx1200m` and reduce DB pool to 5

**Issue**: 502 Bad Gateway on public endpoint
**Root Cause**: All upstream containers unhealthy
**Fix**: Run `./container-manager.sh fix-unhealthy`

**Issue**: Container restart loop
**Root Cause**: JVM OOM killer
**Fix**: Increase container memory limit to 2GB

### 6. Quick Commands Reference

```bash
# SSH to server
ssh -p 22 subbu@dlt.aurigraph.io

# Check healthy containers
docker ps --format '{{.Names}}\t{{.Status}}' | grep healthy

# Restart OOM containers
/home/subbu/scripts/container-manager.sh fix-unhealthy

# Check nginx upstream
curl -sf http://localhost:19029/api/v11/health

# Docker cleanup
docker system prune -f
docker image prune -a -f --filter "until=24h"

# Check public endpoint
curl -sf https://dlt.aurigraph.io/api/v11/health | jq .
```

### 7. Infrastructure Health Checklist

- [ ] At least 2 healthy containers in primary nginx pool
- [ ] Public endpoint returns `{"status":"UP"}`
- [ ] No OOM errors in container logs (`docker logs <container>`)
- [ ] Nginx upstream shows healthy backends
- [ ] Memory usage below 80% per container

---
