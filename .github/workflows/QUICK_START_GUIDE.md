# Quick Start Guide: Phase 5B CI/CD with Self-Hosted Runners

This guide provides a fast-track setup for enabling the `test-quality-gates.yml` workflow with self-hosted runners.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] GitHub repository access (Aurigraph-DLT-Corp/Aurigraph-DLT)
- [ ] macOS 12+ or Linux (Ubuntu 22.04+)
- [ ] 8GB+ RAM, 50GB+ disk space
- [ ] Admin/sudo access for service installation
- [ ] Java 21 installed
- [ ] Maven 3.9+ installed
- [ ] Docker installed and running
- [ ] Active internet connection
- [ ] GitHub Personal Access Token (PAT)

## 5-Minute Quick Setup (macOS)

### Step 1: Create Runner Directory

```bash
mkdir -p ~/github-runners/aurigraph-v11
cd ~/github-runners/aurigraph-v11
```

### Step 2: Get GitHub Token

1. Visit: https://github.com/settings/personal-access-tokens/new
2. Create token with scopes: `repo`, `admin:org_hook`
3. Copy token (you'll need it next)

### Step 3: Download & Extract Runner

```bash
RUNNER_VERSION="2.311.0"
curl -o actions-runner-osx-x64-${RUNNER_VERSION}.tar.gz \
  -L https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-osx-x64-${RUNNER_VERSION}.tar.gz
tar xzf ./actions-runner-osx-x64-${RUNNER_VERSION}.tar.gz
```

### Step 4: Configure Runner

```bash
./config.sh --url https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT \
            --token YOUR_TOKEN_HERE \
            --name aurigraph-v11-runner-$(hostname) \
            --work _work \
            --labels self-hosted,docker,java21,macOS \
            --replace
```

### Step 5: Install & Start Service

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

### Step 6: Verify Runner is Online

Visit: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/settings/actions/runners

You should see your runner listed as **online**.

### Step 7: Trigger Test Workflow

1. Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/actions
2. Select: **Test Quality Gates (Self-Hosted)**
3. Click: **Run workflow**
4. Select branch and click **Run workflow**

Watch the workflow execute on your self-hosted runner!

---

## Detailed Setup (All Platforms)

### macOS Detailed Setup

```bash
# 1. Verify prerequisites
java -version              # Must be 21+
mvn -version              # Must be 3.9+
docker --version          # Must be 24+
docker ps                 # Verify daemon is running

# 2. Create runner home
mkdir -p ~/github-runners/aurigraph-v11
cd ~/github-runners/aurigraph-v11

# 3. Download runner
# Check latest version: https://github.com/actions/runner/releases
curl -o actions-runner-osx-x64-2.311.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-x64-2.311.0.tar.gz

# 4. Extract and verify
tar xzf actions-runner-osx-x64-2.311.0.tar.gz
ls -la          # Should show bin/, lib/, config.sh, run.sh, svc.sh

# 5. Generate GitHub token
# https://github.com/settings/personal-access-tokens/new
# Required scopes: repo, admin:org_hook
# Save token to file: cat > TOKEN.txt

# 6. Configure runner
TOKEN=$(cat TOKEN.txt)
./config.sh --url https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT \
            --token $TOKEN \
            --name aurigraph-v11-runner-$(hostname) \
            --work _work \
            --labels self-hosted,docker,java21,macOS \
            --replace

# 7. Install as launchd service
sudo ./svc.sh install
# System will prompt for password

# 8. Start service
sudo ./svc.sh start
sudo ./svc.sh status
# Should output: "running"

# 9. Verify runner process
ps aux | grep -i run.sh

# 10. Check GitHub - runner should be online within 30 seconds
# https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/settings/actions/runners
```

### Linux Detailed Setup

```bash
# 1. Verify prerequisites
java -version
mvn -version
docker --version
docker ps

# 2. Install dependencies (if missing)
sudo apt-get update
sudo apt-get install -y curl wget git docker.io openjdk-21-jdk maven

# 3. Create runner home
sudo mkdir -p /opt/github-runners/aurigraph-v11
sudo chown $USER:$USER /opt/github-runners/aurigraph-v11
cd /opt/github-runners/aurigraph-v11

# 4. Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# 5. Download runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# 6. Extract
tar xzf actions-runner-linux-x64-2.311.0.tar.gz

# 7. Configure
TOKEN=$(cat TOKEN.txt)  # Or paste directly
./config.sh --url https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT \
            --token $TOKEN \
            --name aurigraph-v11-runner-$(hostname) \
            --work _work \
            --labels self-hosted,docker,java21,linux \
            --replace

# 8. Install as systemd service
sudo ./svc.sh install

# 9. Start service
sudo systemctl start actions.runner.*.service
sudo systemctl status actions.runner.*.service
# Should show "active (running)"

# 10. Enable auto-start
sudo systemctl enable actions.runner.*.service
```

---

## Verification Steps

After setup, verify everything is working:

### Step 1: Check Runner Status

```bash
# macOS
ps aux | grep "[r]un.sh"

# Linux
sudo systemctl status actions.runner.*.service

# GitHub UI
# Visit: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/settings/actions/runners
# Should show: online, idle, macOS/Linux
```

### Step 2: Verify Java Environment

```bash
# Test Java
java -version
javac -version

# Test Maven
mvn --version

# Test in runner context
cd ~/github-runners/aurigraph-v11
./run.sh  # Press Ctrl+C to stop

# Check logs show successful handshake
```

### Step 3: Verify Docker

```bash
docker ps
docker run hello-world
```

### Step 4: Test Workflow Execution

1. Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/actions
2. Click: **Test Quality Gates (Self-Hosted)**
3. Click: **Run workflow**
4. Select branch: **main** or **develop**
5. Click: **Run workflow**
6. Monitor execution:
   - Should start immediately on self-hosted runner
   - Unit tests: ~5-8 minutes
   - Integration tests: ~10-15 minutes
   - Coverage check: ~15-25 minutes
   - Code quality: ~10-15 minutes
   - **Total**: ~40-60 minutes

---

## Workflow Details

### What the Workflow Does

```
test-quality-gates.yml
├── 1. unit-tests (8 min)
│   ├── Checkout code
│   ├── Setup Java 21
│   ├── Run unit tests
│   └── Upload results
│
├── 2. integration-tests (15 min) [depends on unit-tests]
│   ├── Verify Docker
│   ├── Run integration tests
│   └── Upload results
│
├── 3. coverage-check (25 min) [depends on 1+2]
│   ├── Full test suite with JaCoCo
│   ├── Coverage analysis
│   ├── Extract metrics
│   └── Comment on PR
│
├── 4. code-quality (15 min) [depends on 3]
│   ├── Code size analysis
│   ├── SpotBugs scan
│   └── TODO/FIXME check
│
├── 5. quality-gate-summary (5 min) [all jobs]
│   ├── Evaluate all gates
│   └── Post workflow summary
│
└── 6. performance-tests (35 min) [optional, on-demand]
    ├── Run perf tests
    └── Upload results
```

### Key Features

✅ **Self-hosted runner** - Runs on your macOS/Linux machine
✅ **Fast feedback** - Unit tests in 8 minutes
✅ **Parallel execution** - Tests run in parallel where possible
✅ **Coverage gates** - 95% line coverage, 90% branch coverage
✅ **Code quality** - SpotBugs analysis included
✅ **PR comments** - Automatic coverage reports in PRs
✅ **Artifact storage** - 30-90 day retention
✅ **On-demand performance** - Trigger manually for perf tests

### Workflow Triggers

The workflow runs automatically on:

- **Push** to: `main`, `develop`, `feature/aurigraph-v11-*`
- **Pull Request** to: `main`, `develop`
- **Manual trigger** (workflow_dispatch)

### Test Results & Artifacts

Results are available at:

```
GitHub Actions > Test Quality Gates (Self-Hosted) > Run #XXX
├── Artifacts
│   ├── unit-test-results
│   ├── integration-test-results
│   ├── coverage-report
│   ├── code-quality-report
│   └── performance-test-results [if run]
│
└── Summary
    ├── Test status (passed/failed)
    ├── Coverage metrics
    ├── Code quality scores
    └── Execution time
```

---

## Troubleshooting Quick Fixes

### Runner Not Appearing Online

```bash
# Check if runner process is running
ps aux | grep run.sh

# If not, restart service
sudo ./svc.sh restart    # macOS
sudo systemctl restart actions.runner.*.service  # Linux

# Check logs
sudo log stream | grep runner  # macOS
sudo journalctl -u actions.runner.* -f  # Linux
```

### Workflow Not Starting

```bash
# Check runner is idle (not busy)
# GitHub Settings > Actions > Runners

# If busy, check for hanging jobs
ps aux | grep -i java
ps aux | grep -i docker

# Kill hanging processes if needed
killall java
docker system prune -f
```

### Test Failures

```bash
# Increase log verbosity
# Add to workflow: ACTIONS_RUNNER_DEBUG: true

# Check logs in workflow run
# GitHub Actions > Run #XXX > Logs

# Test locally
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean test
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up
docker system prune -a --volumes
rm -rf ~/.m2/repository
cd ~/github-runners/aurigraph-v11/_work
rm -rf */
```

---

## Common Configuration Changes

### Change Runner Labels

```bash
cd ~/github-runners/aurigraph-v11
./config.sh --url https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT \
            --token YOUR_TOKEN \
            --replace
# This will prompt for new labels
```

### Change Assigned Repository

```bash
# Runner can be moved to different repo/organization
# But configuration is org-wide in GitHub settings
# https://github.com/organizations/Aurigraph-DLT-Corp/settings/actions/runners
```

### Increase JVM Memory

```bash
# Edit runner service environment
# macOS: /Library/LaunchDaemons/actions.runner.*.plist
# Linux: /etc/systemd/system/actions.runner.*.service

# Update MAVEN_OPTS:
# -Xmx8g → -Xmx12g (or whatever your system supports)

# Restart service after changes
sudo systemctl daemon-reload && sudo systemctl restart actions.runner.*
```

### Use GitHub Secrets in Workflows

```yaml
# In workflow step
- name: Use secret
  env:
    MY_SECRET: ${{ secrets.MY_SECRET }}
  run: echo "Using secret"
```

Add secrets at:
https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/settings/secrets/actions

---

## Next Steps

1. **Monitor first workflow run** - Check logs for any issues
2. **Configure GitHub Secrets** - Add any required API tokens/credentials
3. **Set up notifications** - Email, Slack, etc. for workflow results
4. **Review test results** - Ensure all tests are executing
5. **Optimize timeouts** - Adjust if workflows consistently exceed timeouts
6. **Add performance tests** - Label PRs with `performance` to run perf tests

---

## Related Documentation

- [Full Setup Guide](./SELF_HOSTED_RUNNER_SETUP.md)
- [Environment Configuration](./RUNNER_ENV_CONFIG.md)
- [Workflow File](./test-quality-gates.yml)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## Support

For issues:

1. Check [troubleshooting section](#troubleshooting-quick-fixes)
2. Review runner logs
3. Consult [Full Setup Guide](./SELF_HOSTED_RUNNER_SETUP.md)
4. Open GitHub issue

---

**Last Updated**: December 26, 2025
**Version**: 1.0
**Estimated Setup Time**: 15-30 minutes (first run ~60 minutes)
