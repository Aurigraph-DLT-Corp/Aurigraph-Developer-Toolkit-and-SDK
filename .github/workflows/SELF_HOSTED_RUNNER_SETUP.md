# Self-Hosted Runner Setup Guide - Phase 5B

This guide provides comprehensive instructions for setting up and configuring self-hosted GitHub Actions runners for the Aurigraph V11 CI/CD pipeline.

## Overview

The `test-quality-gates.yml` workflow uses self-hosted runners to execute:
- **Unit Tests**: Fast feedback loop (8 minutes)
- **Integration Tests**: Database & service integration (15 minutes)
- **Code Coverage**: JaCoCo analysis with quality gates (25 minutes)
- **Code Quality**: SpotBugs & static analysis (15 minutes)
- **Performance Tests**: Optional, on-demand (35 minutes)

## System Requirements

### Hardware Requirements (Recommended)

| Component | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| CPU | 4 cores | 8+ cores | Parallel test execution |
| RAM | 8GB | 16GB+ | Maven + Docker + JVM |
| Disk | 50GB | 100GB+ | Dependencies + artifacts |
| Network | 10Mbps | 100Mbps+ | Fast CI/CD execution |

### Software Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| Java | 21+ | V11 compilation & execution |
| Maven | 3.9+ | Build & test orchestration |
| Docker | 24+ | Integration test containers |
| Git | 2.40+ | Repository management |
| macOS | 12.0+ | If running on macOS |
| Linux | Ubuntu 22.04+ | If running on Linux |

### Network Requirements

- **Outbound HTTPS**: GitHub, Maven Central, Docker Hub
- **Firewall Rules**: Allow outbound on ports 443 (HTTPS), 80 (HTTP)
- **DNS**: Must resolve github.com, docker.io, maven.org
- **Bandwidth**: Minimum 10Mbps sustained for CI/CD operations

## Installation Instructions

### Option 1: macOS Installation (Recommended for Development)

#### Step 1: Create Runner Directory

```bash
# Create directory for GitHub Actions runner
mkdir -p ~/github-runners/aurigraph-v11
cd ~/github-runners/aurigraph-v11

# Verify directory structure
ls -la ~/github-runners/
```

#### Step 2: Download GitHub Actions Runner

```bash
# Download the latest runner version (check for newer versions)
# https://github.com/actions/runner/releases

RUNNER_VERSION="2.311.0"
OS_ARCH="osx-x64"  # For Intel Macs: osx-x64, For Apple Silicon: osx-arm64

curl -o actions-runner-${OS_ARCH}-${RUNNER_VERSION}.tar.gz \
  -L "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-${OS_ARCH}-${RUNNER_VERSION}.tar.gz"

# Verify download
ls -lh actions-runner-*.tar.gz
```

#### Step 3: Extract Runner

```bash
# Extract the runner
tar xzf ./actions-runner-${OS_ARCH}-${RUNNER_VERSION}.tar.gz

# Clean up
rm ./actions-runner-${OS_ARCH}-${RUNNER_VERSION}.tar.gz

# Verify extraction
ls -la
```

#### Step 4: Generate GitHub Token

1. Go to: https://github.com/settings/personal-access-tokens/new
2. Configure token:
   - **Name**: `aurigraph-v11-runner-token`
   - **Expiration**: 90 days
   - **Scopes**:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `admin:org_hook` (For webhook management)
3. Copy the generated token and save securely

Alternative (Classic Token):
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Scopes:
   - ✅ `repo` (Full control of repositories)
   - ✅ `admin:org_hook`
4. Copy the token

#### Step 5: Configure Runner

```bash
# Navigate to runner directory
cd ~/github-runners/aurigraph-v11

# Run configuration script
./config.sh --url https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT \
            --token YOUR_GITHUB_TOKEN_HERE \
            --name aurigraph-v11-runner-$(hostname) \
            --work _work \
            --labels self-hosted,docker,java21,macOS \
            --replace

# Expected output:
# ✓ Runner configured successfully
# Run number in workflow will be generated dynamically
```

#### Step 6: Install as macOS Service

```bash
# Install runner as launchd service (requires admin)
sudo ./svc.sh install

# Start the service
sudo ./svc.sh start

# Check service status
sudo ./svc.sh status

# View logs (follow)
sudo log stream --predicate 'eventMessage contains[cd] "github-runner"' --level debug
```

#### Step 7: Verify Runner is Online

```bash
# Check runner process
ps aux | grep "[r]un.sh"

# Check GitHub settings - Runner should appear as "online"
# https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/settings/actions/runners
```

### Option 2: Linux Installation (Ubuntu/Debian)

#### Step 1: Create Runner Directory

```bash
# Create directory
sudo mkdir -p /opt/github-runners/aurigraph-v11
sudo chown $USER:$USER /opt/github-runners/aurigraph-v11
cd /opt/github-runners/aurigraph-v11
```

#### Step 2: Install Dependencies

```bash
# Update packages
sudo apt-get update
sudo apt-get install -y \
  curl \
  wget \
  git \
  docker.io \
  openjdk-21-jdk \
  maven

# Verify installations
java -version
mvn -version
docker --version
```

#### Step 3-5: Download, Extract, and Configure

```bash
# Same as macOS steps 2-4
RUNNER_VERSION="2.311.0"
OS_ARCH="linux-x64"  # For ARM: linux-arm64

curl -o actions-runner-${OS_ARCH}-${RUNNER_VERSION}.tar.gz \
  -L "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-${OS_ARCH}-${RUNNER_VERSION}.tar.gz"

tar xzf ./actions-runner-${OS_ARCH}-${RUNNER_VERSION}.tar.gz

# Configure runner
./config.sh --url https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT \
            --token YOUR_GITHUB_TOKEN_HERE \
            --name aurigraph-v11-runner-$(hostname) \
            --work _work \
            --labels self-hosted,docker,java21,linux \
            --replace
```

#### Step 6: Install as systemd Service

```bash
# Install as systemd service
sudo ./svc.sh install

# Start service
sudo ./svc.sh start

# Enable autostart on reboot
sudo systemctl enable actions.runner.*.service

# Check service status
sudo systemctl status actions.runner.*.service

# View logs
sudo journalctl -u actions.runner.*.service -f
```

### Option 3: Docker Container (Advanced)

For running multiple runners in containers:

```bash
# Create Dockerfile
cat > Dockerfile <<'EOF'
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
  curl wget git docker.io openjdk-21-jdk maven \
  && rm -rf /var/lib/apt/lists/*

# Create runner user
RUN useradd -m github-runner

WORKDIR /home/github-runner

# Download runner
RUN curl -o actions-runner-linux-x64.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz && \
  tar xzf ./actions-runner-linux-x64.tar.gz && \
  rm ./actions-runner-linux-x64.tar.gz && \
  chown -R github-runner:github-runner /home/github-runner

USER github-runner

ENTRYPOINT ["./run.sh"]
EOF

# Build image
docker build -t aurigraph-v11-runner:latest .

# Run container
docker run -d \
  --name aurigraph-v11-runner \
  --env RUNNER_TOKEN=YOUR_TOKEN \
  --env RUNNER_URL=https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  aurigraph-v11-runner:latest
```

## Configuration Verification

### Step 1: Verify Runner Registration

```bash
# Check runner is online in GitHub settings
curl -s https://api.github.com/repos/Aurigraph-DLT-Corp/Aurigraph-DLT/actions/runners \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_TOKEN" | grep "busy\|online"
```

### Step 2: Test Java Environment

```bash
# Verify Java is working
java -version
javac -version

# Check JAVA_HOME (if needed)
export JAVA_HOME=/usr/libexec/java_home -v 21
java -version
```

### Step 3: Test Maven Setup

```bash
# Navigate to V11 project
cd aurigraph-av10-7/aurigraph-v11-standalone

# Test compilation
./mvnw clean compile -DskipTests

# Verify dependency download
ls -la ~/.m2/repository | head -20
```

### Step 4: Test Docker Setup

```bash
# Verify Docker daemon
docker ps

# Check Docker can build images
docker pull hello-world
docker run hello-world
```

### Step 5: Trigger Test Workflow

1. Open: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/actions
2. Click "Test Quality Gates (Self-Hosted)"
3. Click "Run workflow"
4. Verify it runs on `self-hosted` runner (check logs)

## Runner Labels Explained

The workflow uses these labels for runner selection:

```yaml
runs-on: self-hosted
```

Or more specific:

```yaml
runs-on: [self-hosted, docker, java21, macOS]
```

Label breakdown:
- `self-hosted`: Runner not hosted by GitHub
- `docker`: Docker is installed and configured
- `java21`: Java 21 is installed
- `macOS` or `linux`: Operating system

## Maintenance & Operations

### Monitoring Runner Health

```bash
# macOS: Check service status
sudo ./svc.sh status

# Linux: Check service status
sudo systemctl status actions.runner.*.service

# View recent logs
# macOS:
sudo log stream --level debug | grep github-runner

# Linux:
sudo journalctl -u actions.runner.*.service -n 100 -f
```

### Restarting Runner

```bash
# macOS
sudo ./svc.sh stop
sudo ./svc.sh start

# Linux
sudo systemctl restart actions.runner.*.service
```

### Cleaning Up Runner Cache

```bash
# Remove old workflow runs
cd ~/github-runners/aurigraph-v11/_work
rm -rf */

# Clean Maven cache (optional)
rm -rf ~/.m2/repository

# Clean Docker (warning: removes all images/containers)
docker system prune -a --volumes
```

### Upgrading Runner

```bash
# Download new version
cd ~/github-runners/aurigraph-v11
RUNNER_VERSION="2.312.0"  # Update to latest
curl -o actions-runner-osx-x64-${RUNNER_VERSION}.tar.gz \
  -L "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-osx-x64-${RUNNER_VERSION}.tar.gz"

# Stop current runner
sudo ./svc.sh stop

# Backup current installation
mv actions-runner actions-runner.backup

# Extract new version
tar xzf ./actions-runner-osx-x64-${RUNNER_VERSION}.tar.gz

# Start new runner
sudo ./svc.sh start

# Verify new version
./config.sh --check
```

## Troubleshooting

### Runner Not Appearing Online

**Problem**: Runner shows offline in GitHub settings

**Solutions**:
```bash
# 1. Check if runner process is running
ps aux | grep "[r]un.sh"

# 2. View runner logs
# macOS:
sudo log stream --predicate 'eventMessage contains[cd] "github-runner"'

# Linux:
sudo journalctl -u actions.runner.*.service -f

# 3. Restart runner
sudo ./svc.sh restart

# 4. Regenerate runner token (if needed)
# Re-run config.sh with new token from GitHub
```

### Java Not Found in Workflow

**Problem**: `java: command not found` in workflow logs

**Solutions**:
```bash
# 1. Verify Java is installed globally
which java
java -version

# 2. Set JAVA_HOME in runner service
# macOS: Edit /Library/LaunchDaemons/actions.runner.*
# Add: <key>JAVA_HOME</key> <string>/usr/libexec/java_home -v 21</string>

# Linux: Edit /etc/systemd/system/actions.runner.*.service
# Add: Environment="JAVA_HOME=/usr/lib/jvm/java-21-openjdk"

# 3. Restart service after changes
sudo systemctl daemon-reload
sudo systemctl restart actions.runner.*.service
```

### Docker Daemon Not Accessible

**Problem**: `Cannot connect to Docker daemon` in workflows

**Solutions**:
```bash
# 1. Verify Docker is running
docker ps

# 2. Add runner user to docker group
sudo usermod -aG docker $(whoami)
newgrp docker

# 3. Restart Docker service
sudo systemctl restart docker

# 4. Verify permissions
ls -la /var/run/docker.sock
```

### Out of Disk Space

**Problem**: Workflows fail with "no space left on device"

**Solutions**:
```bash
# 1. Check disk usage
df -h

# 2. Clean up Docker
docker system prune -a --volumes

# 3. Clean up Maven cache
rm -rf ~/.m2/repository

# 4. Clean up workflow artifacts
cd _work
find . -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null

# 5. Check for large files
find ~ -size +100M -type f
```

### High CPU/Memory Usage

**Problem**: Runner consumes excessive resources

**Solutions**:
```bash
# 1. Monitor resource usage
top -l 1 | head -20

# 2. Limit Maven memory
export MAVEN_OPTS="-Xmx4g"

# 3. Reduce parallel test execution
# Edit workflow to use single-threaded tests
-DthreadCount=1

# 4. Increase swap if needed
# Linux:
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## Environment Variables for Runner

Set these in the runner service for broader availability:

**macOS** (`/Library/LaunchDaemons/actions.runner.*.plist`):
```xml
<key>EnvironmentVariables</key>
<dict>
  <key>JAVA_HOME</key>
  <string>/usr/libexec/java_home -v 21</string>
  <key>MAVEN_OPTS</key>
  <string>-Xmx8g -XX:+UseG1GC</string>
  <key>DOCKER_HOST</key>
  <string>unix:///var/run/docker.sock</string>
</dict>
```

**Linux** (`/etc/systemd/system/actions.runner.*.service`):
```ini
[Service]
Environment="JAVA_HOME=/usr/lib/jvm/java-21-openjdk"
Environment="MAVEN_OPTS=-Xmx8g -XX:+UseG1GC"
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
```

## Security Best Practices

1. **Token Management**:
   - Rotate tokens every 90 days
   - Use separate tokens per runner
   - Never commit tokens to repository

2. **Access Control**:
   - Restrict runner to specific repositories
   - Use runner groups for permission management
   - Audit runner activity in GitHub logs

3. **Network Security**:
   - Run runners on private networks
   - Use VPN if runners are remote
   - Firewall restrict runner access

4. **Credential Management**:
   - Use GitHub Secrets for sensitive data
   - Never log credentials in workflows
   - Rotate deployment keys regularly

5. **Update Maintenance**:
   - Keep runner software updated
   - Update Java and Maven regularly
   - Monitor security advisories

## Performance Optimization Tips

1. **Cache Strategy**:
   - Maven cache is critical for speed
   - Docker image caching improves integration tests
   - Artifact caching reduces network I/O

2. **Resource Allocation**:
   - Use 8+ GB RAM for Maven
   - SSD recommended for artifact storage
   - High-bandwidth network connection beneficial

3. **Parallel Execution**:
   - Unit tests run in parallel by default
   - Integration tests are sequential (Docker limitation)
   - Adjust thread count based on CPU cores

4. **Network Optimization**:
   - Use local Maven mirror if possible
   - Cache Docker images locally
   - Reduce artifact size with shade plugin

## Related Documentation

- [GitHub Actions Runner Documentation](https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners)
- [GitHub Actions Workflow File](./test-quality-gates.yml)
- [Aurigraph V11 Architecture](../ARCHITECTURE.md)
- [Test Plan](../aurigraph-av10-7/aurigraph-v11-standalone/COMPREHENSIVE-TEST-PLAN.md)

## Support & Contact

For issues with self-hosted runners:

1. Check [GitHub Actions Documentation](https://docs.github.com/en/actions)
2. Review [Troubleshooting Guide](#troubleshooting)
3. Check runner logs for detailed error messages
4. Open GitHub issue in Aurigraph-DLT repository

---

**Last Updated**: December 26, 2025
**Version**: 1.0
**Tested On**: macOS 13.0+, Ubuntu 22.04 LTS
