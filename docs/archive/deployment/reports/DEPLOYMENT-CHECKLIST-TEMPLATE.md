# 📋 Deployment Checklist Template

**Purpose**: Reusable checklist for all future Story deployments (Stories 6-9+)
**Created**: December 23, 2025
**For Use**: Next sprint cycles and production rollouts
**Customization**: Replace `{StoryNumber}` with actual story number

---

## 🎯 PRE-DEPLOYMENT CHECKLIST

### Code & Documentation Review
- [ ] **Code Review Completed**
  - [ ] Pull request reviewed by at least 2 people
  - [ ] All comments addressed
  - [ ] Merge conflicts resolved
  - [ ] Commit messages follow convention: `feat(AV11-601-{N}): Description`

- [ ] **Tests Passing Locally**
  - [ ] Run: `./mvnw clean test -q`
  - [ ] All unit tests passing (0 failures)
  - [ ] All integration tests passing
  - [ ] Test coverage >95%
  - [ ] No flaky tests identified

- [ ] **Code Compilation Success**
  - [ ] Run: `./mvnw clean compile -q`
  - [ ] Zero compilation errors
  - [ ] Zero warnings (or approved warnings)
  - [ ] No deprecation warnings
  - [ ] Check for unused imports/variables

- [ ] **Documentation Complete**
  - [ ] Architecture guide written
  - [ ] API endpoints documented
  - [ ] Database schema documented
  - [ ] Integration points documented
  - [ ] Javadoc added to public methods

### JIRA Ticket Preparation
- [ ] **Story Ticket Updated**
  - [ ] Story status is "In Progress" or "Ready for Deployment"
  - [ ] Story points assigned (not 0)
  - [ ] Description updated with actual implementation details
  - [ ] Acceptance criteria marked complete

- [ ] **Test Coverage Documented**
  - [ ] JIRA comment with test counts (e.g., "145 tests, 97% coverage")
  - [ ] Performance metrics documented
  - [ ] Known limitations noted (if any)

- [ ] **Deployment Approval**
  - [ ] Tech lead approved deployment
  - [ ] Security review completed (if applicable)
  - [ ] Product owner aware of deployment

### Environment Preparation
- [ ] **Credentials Verified**
  - [ ] JIRA API token valid (check: `Credentials.md`)
  - [ ] GitHub PAT valid (check: `Credentials.md`)
  - [ ] SSH access to dlt.aurigraph.io working
  - [ ] Remote server SSH key/password current

- [ ] **Target Environment Ready**
  - [ ] dlt.aurigraph.io is up and healthy
  - [ ] Service can be stopped/started safely
  - [ ] Disk space >10GB available
  - [ ] Memory available (8GB+ free)
  - [ ] PostgreSQL database is healthy

- [ ] **Backup Systems Ready**
  - [ ] Previous JAR backup exists
  - [ ] Rollback procedure documented
  - [ ] Database backup taken (if schema changed)
  - [ ] Backup location: `/home/subbu/aurigraph-v12.jar.backup-*`

### GitHub Preparation
- [ ] **Branch Ready for Merge**
  - [ ] Feature branch is `feature/AV11-601-{N}`
  - [ ] All commits on branch related to story
  - [ ] No unrelated commits mixed in
  - [ ] Branch is up-to-date with main

- [ ] **GitHub Actions Verified**
  - [ ] Workflow file exists: `.github/workflows/v12-deploy-remote.yml`
  - [ ] Workflow is enabled (not disabled)
  - [ ] Latest workflow version configured
  - [ ] Secrets configured in GitHub (SLACK_WEBHOOK_URL, etc.)

---

## 🚀 DEPLOYMENT EXECUTION CHECKLIST

### Deployment Start
- [ ] **Pre-Deployment Tasks**
  - [ ] Create monitoring/log window (ssh + tmux recommended)
  - [ ] Test SSH connection to remote: `ssh subbu@dlt.aurigraph.io`
  - [ ] Check current service status: `systemctl status aurigraph-v12`
  - [ ] Note start time for latency tracking
  - [ ] Notify team in Slack: "Deploying Story {N} starting now"

### Trigger Deployment
- [ ] **GitHub Actions Workflow Dispatch**
  - [ ] Run: `gh workflow run v12-deploy-remote.yml -f environment=production`
  - [ ] Verify Run ID returned (e.g., 20457697577)
  - [ ] Copy Run ID for monitoring
  - [ ] Open GitHub UI: `gh run view {RunID} --repo Aurigraph-DLT-Corp/Aurigraph-DLT`

### Monitor Build Phase (15-20 minutes)
- [ ] **Compilation Progress**
  - [ ] Check logs: `gh run view {RunID} --log` (after build complete)
  - [ ] Look for "Build successful" message
  - [ ] Verify all 145 tests ran and passed
  - [ ] Check for any warnings (LOG level warnings OK)

- [ ] **Build Artifact Created**
  - [ ] JAR file created successfully
  - [ ] File size reasonable (~150-200MB)
  - [ ] Artifact uploaded to GitHub Actions cache

### Monitor Deploy Phase (10-15 minutes)
- [ ] **Pre-Deployment Checks**
  - [ ] Current service health checked
  - [ ] Backup created: `aurigraph-v12.jar.backup-{timestamp}`
  - [ ] New JAR copied to remote

- [ ] **Service Replacement**
  - [ ] Current service stopped gracefully
  - [ ] New JAR deployed to `/home/subbu/aurigraph-v12.jar`
  - [ ] systemd service updated
  - [ ] Service started successfully

- [ ] **Health Checks Pass**
  - [ ] Watch health check attempts (12 retries × 10 seconds)
  - [ ] All 3 endpoints responding:
    - [ ] `/q/health/live` → status: UP
    - [ ] `/api/v11/health` → status: UP
    - [ ] `/api/v11/info` → version info showing
  - [ ] Health checks complete in <120 seconds

- [ ] **NGINX Routing Updated**
  - [ ] NGINX config validated
  - [ ] Reverse proxy pointing to port 9003
  - [ ] NGINX reloaded (no downtime)
  - [ ] Endpoints accessible through HTTPS

### Monitor Post-Deploy Phase (2-3 minutes)
- [ ] **Notifications Sent**
  - [ ] Slack notification received (if configured)
  - [ ] GitHub deployment summary created
  - [ ] Team notified in chat

---

## ✅ POST-DEPLOYMENT VERIFICATION CHECKLIST

### Automated Verification
- [ ] **Run Verification Script**
  ```bash
  bash /Users/subbujois/subbuworkingdir/Aurigraph-DLT/POST-DEPLOYMENT-VERIFICATION.sh
  ```
  - [ ] All 7 phases complete (50+ tests)
  - [ ] No failed tests
  - [ ] Success rate: 100%
  - [ ] Output: "✅ DEPLOYMENT VERIFICATION SUCCESSFUL"

### Manual Endpoint Testing
- [ ] **Health Endpoints**
  ```bash
  curl https://dlt.aurigraph.io/api/v11/health
  curl https://dlt.aurigraph.io/api/v11/info
  curl https://dlt.aurigraph.io:9003/q/health/live
  ```
  - [ ] All return HTTP 200
  - [ ] Status field shows "UP"
  - [ ] Response time <100ms

- [ ] **Story-Specific Endpoints**
  - [ ] For Story 4: Test `/api/v12/secondary-tokens` endpoint
  - [ ] For Story 5: Test `/api/v12/vvb/approvals` endpoint
  - [ ] Test POST/GET/PUT operations as applicable
  - [ ] Verify error handling (test invalid input)

- [ ] **Portal Access**
  - [ ] Open https://dlt.aurigraph.io in browser
  - [ ] Portal loads without errors
  - [ ] All pages accessible
  - [ ] Dashboard metrics display correctly

### Log Inspection
- [ ] **Service Logs Check**
  ```bash
  ssh subbu@dlt.aurigraph.io
  sudo journalctl -u aurigraph-v12 -n 50 --no-pager
  ```
  - [ ] No ERROR level logs
  - [ ] No exceptions in logs
  - [ ] No memory warnings (OutOfMemory, heap, GC)
  - [ ] Service started successfully message present

- [ ] **NGINX Logs Check**
  ```bash
  ssh subbu@dlt.aurigraph.io
  tail -20 /var/log/nginx/error.log
  ```
  - [ ] No 502 Bad Gateway errors
  - [ ] No SSL/TLS errors
  - [ ] No upstream connection refused errors

### Database Verification
- [ ] **Database Connectivity**
  - [ ] Connection test passes
  - [ ] Flyway migrations applied (if schema changed)
  - [ ] New tables/columns present (if applicable)
  - [ ] Data integrity verified

### Performance Baseline
- [ ] **Response Time Check**
  - [ ] Health endpoint: <50ms (target <100ms)
  - [ ] Info endpoint: <100ms
  - [ ] Custom endpoints: <500ms
  - [ ] No sudden slowdowns detected

- [ ] **Resource Usage**
  - [ ] Memory: Expected range (monitor growth)
  - [ ] CPU: Baseline established
  - [ ] Disk: No rapid filling
  - [ ] Network: Normal traffic patterns

---

## 📋 JIRA UPDATES CHECKLIST

### Update Story Ticket
- [ ] **Story Status**
  - [ ] Change status from "In Progress" → "Done"
  - [ ] Verify status updates correctly

- [ ] **Add Labels**
  - [ ] Add label: `production-ready`
  - [ ] Add label: `tested`
  - [ ] (Optional) Add label: `performance-verified`

- [ ] **Add Comments**
  - [ ] Comment template:
    ```
    ✅ {StoryName} implementation complete and deployed.

    Deployment Details:
    - Workflow Run: {RunID}
    - Deployment Time: {TimeInMinutes} minutes
    - Tests Passing: {TestCount}/{TestCount} (100%)
    - Test Coverage: {CoveragePercent}%
    - Performance: All endpoints <{MaxLatency}ms

    Verification:
    ✅ All health checks passing
    ✅ API endpoints responding (200 OK)
    ✅ Portal accessible
    ✅ Logs clean (no errors)
    ✅ Performance baseline established

    Ready for next sprint.
    ```

### Link Epic (if not linked)
- [ ] Story linked to AV11-601 epic
- [ ] Epic status reflects progress

### Create Subtasks (if needed)
- [ ] Performance monitoring subtask (if applicable)
- [ ] Documentation update subtask (if needed)

---

## 🔄 ROLLBACK CHECKLIST (If Issues Detected)

### Immediate Actions
- [ ] **Notify Team**
  - [ ] Send Slack alert: "Deployment issue detected - initiating rollback"
  - [ ] Document issue description
  - [ ] Note time issue detected

- [ ] **Automatic Rollback Verification**
  - [ ] GitHub Actions initiated rollback automatically (if health check failed)
  - [ ] Previous JAR restored from backup
  - [ ] Service restarted from previous version
  - [ ] Health checks re-run

### Manual Rollback (if automatic fails)
```bash
ssh subbu@dlt.aurigraph.io
sudo systemctl stop aurigraph-v12
cd /home/subbu
LATEST_BACKUP=$(ls -t aurigraph-v12.jar.backup-* | head -1)
cp "$LATEST_BACKUP" aurigraph-v12.jar
sudo systemctl start aurigraph-v12
sleep 15
curl http://localhost:9003/api/v11/health
```

- [ ] **Rollback Verification**
  - [ ] Previous version running
  - [ ] Health checks passing
  - [ ] Endpoints accessible
  - [ ] Logs clean (no new errors)

### Investigation & Fix
- [ ] **Root Cause Analysis**
  - [ ] Review deployment logs
  - [ ] Check application logs
  - [ ] Identify specific failure point
  - [ ] Document findings

- [ ] **Fix Application**
  - [ ] Address issue in code
  - [ ] Run tests locally
  - [ ] Commit fix with message: `fix(AV11-601-{N}): Issue description`
  - [ ] Create new PR for fix

- [ ] **Retry Deployment**
  - [ ] Follow entire deployment checklist again
  - [ ] Test thoroughly before running
  - [ ] Deploy with same workflow

---

## 📊 POST-DEPLOYMENT DOCUMENTATION CHECKLIST

### Update Deployment Record
- [ ] **Record Deployment Details**
  - [ ] File: `DEPLOYMENT-RECORDS.md`
  - [ ] Date: {DeploymentDate}
  - [ ] Story: AV11-601-{N}
  - [ ] Status: ✅ Success (or ❌ Rolled back with details)
  - [ ] Duration: {TotalMinutes} minutes
  - [ ] Workflow Run: {RunID}

- [ ] **Update Version History**
  - [ ] File: `AurigraphDLTVersionHistory.md`
  - [ ] Add entry for new version
  - [ ] Document changes
  - [ ] Note deployment time
  - [ ] Link to GitHub commit

### Prepare Next Sprint
- [ ] **Story 5 Preparation** (Next story kickoff)
  - [ ] Planning document ready
  - [ ] Design decisions made
  - [ ] Team aligned on approach
  - [ ] Implementation schedule set

- [ ] **Metrics & Learning**
  - [ ] Deployment time tracked
  - [ ] Performance metrics recorded
  - [ ] Issues encountered documented
  - [ ] Improvements noted for next sprint

---

## ✨ DEPLOYMENT SUCCESS CRITERIA

### All Criteria Must Be Met
- [ ] Code compiles without errors
- [ ] All tests passing (0 failures)
- [ ] Health checks pass (120 seconds)
- [ ] API endpoints responding (HTTP 200)
- [ ] Portal accessible
- [ ] Logs clean (no ERROR level)
- [ ] Performance baseline established
- [ ] JIRA ticket updated to "Done"
- [ ] Team notified
- [ ] Documentation updated

### Deployment is FAILED if ANY:
- ✗ Compilation errors present
- ✗ Any tests failing
- ✗ Health checks timeout after 120s
- ✗ API endpoints returning errors (4xx, 5xx)
- ✗ Portal not accessible
- ✗ ERROR level logs present
- ✗ Service crashes shortly after start
- ✗ Memory/resource issues detected
- ✗ Database connection fails

---

## 📞 TROUBLESHOOTING GUIDE

### Issue: Build Phase Fails
**Symptoms**: `./mvnw clean package` fails
**Solutions**:
1. Check Java version: `java --version` (must be 21+)
2. Clear Maven cache: `rm -rf ~/.m2/repository`
3. Check disk space: `df -h`
4. Review build logs: Check GitHub Actions log output

### Issue: Deploy Phase Fails
**Symptoms**: Service doesn't start, health checks timeout
**Solutions**:
1. Check systemd service status: `sudo systemctl status aurigraph-v12`
2. Review journal logs: `sudo journalctl -u aurigraph-v12 -n 50`
3. Check port conflicts: `lsof -i :9003`
4. Verify database connection: Check PostgreSQL status
5. Trigger automatic rollback (wait 120s)

### Issue: Health Checks Fail
**Symptoms**: Endpoints returning errors or not responding
**Solutions**:
1. Wait 30 seconds (app may still be starting)
2. Check if service is running: `systemctl status aurigraph-v12`
3. Verify endpoint URL: `curl http://localhost:9003/api/v11/health`
4. Review app logs for startup errors
5. Check if port 9003 is correct

### Issue: NGINX Routing Broken
**Symptoms**: HTTPS endpoints not working, 502 Bad Gateway
**Solutions**:
1. Check NGINX config: `sudo nginx -t`
2. Reload NGINX: `sudo systemctl reload nginx`
3. Check upstream definition: `grep backend_api /etc/nginx/nginx.conf`
4. Verify backend listening: `ss -tlnp | grep 9003`

### Issue: Database Migrations Fail
**Symptoms**: Flyway errors in logs
**Solutions**:
1. Check database connection
2. Verify migrations file exists
3. Check for conflicting migration IDs
4. Manually review database state: `psql -d j4c_db`

---

## 🎯 Quick Reference Commands

```bash
# Check deployment status
gh run view {RunID} --repo Aurigraph-DLT-Corp/Aurigraph-DLT

# Watch deployment in real-time
gh run watch {RunID} --repo Aurigraph-DLT-Corp/Aurigraph-DLT

# View logs when complete
gh run view {RunID} --repo Aurigraph-DLT-Corp/Aurigraph-DLT --log

# Check service status
ssh subbu@dlt.aurigraph.io "sudo systemctl status aurigraph-v12"

# View logs
ssh subbu@dlt.aurigraph.io "sudo journalctl -u aurigraph-v12 -n 50"

# Test endpoint
curl https://dlt.aurigraph.io/api/v11/health

# Run verification
bash /Users/subbujois/subbuworkingdir/Aurigraph-DLT/POST-DEPLOYMENT-VERIFICATION.sh

# Rollback manually
ssh subbu@dlt.aurigraph.io << 'CMD'
sudo systemctl stop aurigraph-v12
cd /home/subbu
cp $(ls -t aurigraph-v12.jar.backup-* | head -1) aurigraph-v12.jar
sudo systemctl start aurigraph-v12
CMD
```

---

**Template Version**: 1.0
**Created**: December 23, 2025
**For Stories**: AV11-601-5 through AV11-601-9+
**Review Date**: Before each deployment
**Last Updated**: December 23, 2025
