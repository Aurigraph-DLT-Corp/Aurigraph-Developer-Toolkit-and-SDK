# Self-Hosted Runner Environment Configuration Guide

This guide documents the recommended environment configuration for self-hosted runners executing the Aurigraph V11 test-quality-gates workflow.

## Environment Variables Configuration

### Global Environment Variables (Set in Runner Service)

These variables should be configured at the runner service level for all workflows:

#### macOS Configuration

Edit `/Library/LaunchDaemons/actions.runner.*.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>actions.runner.Aurigraph-DLT-Corp-Aurigraph-DLT.aurigraph-v11-runner</string>

  <key>Program</key>
  <string>/Users/subbujois/github-runners/aurigraph-v11/run.sh</string>

  <key>WorkingDirectory</key>
  <string>/Users/subbujois/github-runners/aurigraph-v11</string>

  <key>EnvironmentVariables</key>
  <dict>
    <!-- Java Configuration -->
    <key>JAVA_HOME</key>
    <string>/opt/homebrew/opt/openjdk@21</string>

    <!-- Maven Configuration -->
    <key>MAVEN_OPTS</key>
    <string>-Xmx8g -XX:+UseG1GC -Dmaven.wagon.http.ssl.insecure=false</string>

    <key>M2_HOME</key>
    <string>/opt/homebrew/opt/maven</string>

    <!-- Docker Configuration -->
    <key>DOCKER_HOST</key>
    <string>unix:///var/run/docker.sock</string>

    <!-- Build Configuration -->
    <key>CI</key>
    <string>true</string>

    <key>GITHUB_ACTIONS</key>
    <string>true</string>

    <!-- Network Configuration (for internal proxies if needed) -->
    <!-- <key>HTTP_PROXY</key> -->
    <!-- <string>http://proxy.example.com:3128</string> -->
    <!-- <key>HTTPS_PROXY</key> -->
    <!-- <string>http://proxy.example.com:3128</string> -->
    <!-- <key>NO_PROXY</key> -->
    <!-- <string>localhost,127.0.0.1,github.com</string> -->
  </dict>

  <key>StandardOutPath</key>
  <string>/var/log/github-runner-stdout.log</string>

  <key>StandardErrorPath</key>
  <string>/var/log/github-runner-stderr.log</string>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>
</dict>
</plist>
```

#### Linux Configuration (systemd)

Edit `/etc/systemd/system/actions.runner.*.service`:

```ini
[Unit]
Description=GitHub Actions Runner
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=github-runner
WorkingDirectory=/opt/github-runners/aurigraph-v11

# Environment Variables
Environment="JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64"
Environment="MAVEN_OPTS=-Xmx8g -XX:+UseG1GC -Dmaven.wagon.http.ssl.insecure=false"
Environment="M2_HOME=/usr/share/maven"
Environment="DOCKER_HOST=unix:///var/run/docker.sock"
Environment="CI=true"
Environment="GITHUB_ACTIONS=true"
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# For HTTP proxies (if needed):
# Environment="HTTP_PROXY=http://proxy.example.com:3128"
# Environment="HTTPS_PROXY=http://proxy.example.com:3128"
# Environment="NO_PROXY=localhost,127.0.0.1,github.com"

ExecStart=/opt/github-runners/aurigraph-v11/run.sh

# Restart policy
Restart=always
RestartSec=15

# Process management
TimeoutStopSec=30
KillMode=process

# Resource limits (adjust based on hardware)
MemoryMax=12G
CPUQuota=80%

[Install]
WantedBy=multi-user.target
```

Then reload and restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart actions.runner.*.service
```

## Directory Structure & Permissions

### Recommended Directory Layout

```
/Users/subbujois/github-runners/
├── aurigraph-v11/              # Runner installation
│   ├── bin/
│   ├── lib/
│   ├── config.sh
│   ├── run.sh
│   ├── svc.sh
│   ├── _work/                  # Working directory (symlink to SSD recommended)
│   └── .runner                 # Runner config file
├── cache/                      # Optional: shared cache
└── logs/                        # Optional: centralized logs
```

### Setting Correct Permissions

```bash
# macOS
cd ~/github-runners/aurigraph-v11
chmod +x run.sh config.sh svc.sh *.sh

# Linux
cd /opt/github-runners/aurigraph-v11
sudo chown -R github-runner:github-runner .
sudo chmod +x run.sh config.sh svc.sh *.sh
```

## Java Configuration Details

### Verify Java Installation

```bash
# Check Java version (must be 21+)
java -version
# Expected: openjdk version "21" or higher

# Check Java location
which java
/opt/homebrew/opt/openjdk@21/bin/java  # macOS
/usr/bin/java                           # Linux

# Verify JAVA_HOME
echo $JAVA_HOME
$JAVA_HOME/bin/java -version
```

### Java Virtual Machine Options

The following JVM options are configured for Maven builds:

```
-Xmx8g              # Maximum heap size: 8GB (adjust based on RAM)
-XX:+UseG1GC        # Garbage collector optimized for large heaps
-XX:+UseStringDedup # String deduplication to reduce memory
```

For low-memory runners (4-8GB RAM), adjust to:
```
-Xmx4g              # Reduce to 4GB
-XX:+UseG1GC
```

### Multiple Java Versions (if needed)

```bash
# macOS: Use jenv to manage multiple Java versions
brew install jenv

# Add Java homes
jenv add $(/usr/libexec/java_home -v 21)
jenv add $(/usr/libexec/java_home -v 17)  # If needed

# Set global version
jenv global 21

# Set per-directory version (if needed)
echo "21" > ~/github-runners/.java-version
```

## Maven Configuration

### Maven Settings File

Create/edit `~/.m2/settings.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">

  <!-- Local Repository -->
  <localRepository>${user.home}/.m2/repository</localRepository>

  <!-- Repository Mirrors (for faster downloads) -->
  <mirrors>
    <mirror>
      <id>aliyun</id>
      <name>Aliyun Central Mirror</name>
      <url>https://maven.aliyun.com/repository/central</url>
      <mirrorOf>central</mirrorOf>
    </mirror>
    <mirror>
      <id>central</id>
      <name>Maven Central Repository</name>
      <url>https://repo.maven.apache.org/maven2</url>
      <mirrorOf>*</mirrorOf>
    </mirror>
  </mirrors>

  <!-- Profile Configuration -->
  <profiles>
    <profile>
      <id>ci</id>
      <activation>
        <property>
          <name>ci</name>
          <value>true</value>
        </property>
      </activation>
      <properties>
        <maven.test.skip>false</maven.test.skip>
        <maven.javadoc.skip>true</maven.javadoc.skip>
        <maven.source.skip>true</maven.source.skip>
      </properties>
    </profile>
  </profiles>

  <!-- Active Profiles -->
  <activeProfiles>
    <activeProfile>ci</activeProfile>
  </activeProfiles>
</settings>
```

### Maven Cache Optimization

```bash
# Pre-populate Maven cache (run once)
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw dependency:go-offline

# This downloads all dependencies, saving time on first test run
# Cache location: ~/.m2/repository

# Monitor cache size
du -sh ~/.m2/repository

# Clean old artifacts (if space-constrained)
./mvnw dependency:purge-local-repository
```

## Docker Configuration

### Verify Docker Setup

```bash
# Check Docker daemon
docker ps

# List images
docker images

# Check Docker version
docker --version

# Inspect Docker resources
docker info | grep -A 10 "Resource"
```

### Docker User Permissions

```bash
# Add runner user to docker group (Linux)
sudo usermod -aG docker github-runner

# Apply group membership without logout
newgrp docker

# Verify docker access
docker ps

# For persistent permissions
sudo systemctl restart docker
```

### Docker Daemon Configuration

Optimize Docker for CI/CD at `/etc/docker/daemon.json` (Linux):

```json
{
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 10,
  "bridge": "none"
}
```

Then restart:

```bash
sudo systemctl restart docker
```

### Docker Cleanup Script

Create `~/github-runners/cleanup-docker.sh`:

```bash
#!/bin/bash
set -e

echo "Cleaning up Docker resources..."

# Remove stopped containers
docker container prune -f --filter "until=72h"

# Remove unused images
docker image prune -f --filter "until=72h"

# Remove unused volumes
docker volume prune -f

# Remove unused networks
docker network prune -f

# Show cleaned up space
docker system df

echo "Docker cleanup complete!"
```

Make executable and run periodically:

```bash
chmod +x ~/github-runners/cleanup-docker.sh
crontab -e
# Add: 0 2 * * * ~/github-runners/cleanup-docker.sh
```

## Git Configuration

### Set Git Identity

```bash
# Global configuration
git config --global user.name "Aurigraph V11 CI Runner"
git config --global user.email "ci-runner@aurigraph.io"

# For specific repository
cd aurigraph-av10-7
git config user.name "Aurigraph V11 CI Runner"
git config user.email "ci-runner@aurigraph.io"
```

### Git SSH Configuration (for private repos)

```bash
# If cloning private repos, set up SSH key
ssh-keygen -t ed25519 -f ~/.ssh/github-runner-key -N ""

# Add to GitHub: Settings > Deploy Keys

# Configure SSH
cat > ~/.ssh/config <<EOF
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github-runner-key
  StrictHostKeyChecking no
EOF

chmod 600 ~/.ssh/config
```

## Network Configuration

### Firewall Rules (if applicable)

Allow outbound connections to:

```
GitHub:
  - github.com:443 (HTTPS)
  - api.github.com:443 (API)
  - uploads.github.com:443 (Uploads)

Maven/Java:
  - repo.maven.apache.org:443
  - central.maven.org:443
  - repo1.maven.org:443

Docker:
  - docker.io:443
  - registry.hub.docker.com:443

Other:
  - Any required package registries
```

### Proxy Configuration (if behind proxy)

For Maven:

```bash
export HTTP_PROXY=http://proxy.example.com:3128
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1,github.com
```

For Docker (Linux):

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
cat > /etc/systemd/system/docker.service.d/http-proxy.conf <<EOF
[Service]
Environment="HTTP_PROXY=http://proxy.example.com:3128"
Environment="HTTPS_PROXY=http://proxy.example.com:3128"
Environment="NO_PROXY=localhost,127.0.0.1"
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

## Performance Tuning

### Resource Allocation

```bash
# Check available resources
# macOS
system_profiler SPHardwareDataType

# Linux
cat /proc/meminfo
cat /proc/cpuinfo | grep processor

# Free up resources before running
# macOS
purge

# Linux
sync; echo 3 > /proc/sys/vm/drop_caches
```

### Disk I/O Optimization

```bash
# Check disk usage
df -h

# Move _work directory to SSD if possible
cd ~/github-runners/aurigraph-v11
mv _work _work.old
mkdir _work

# Create symlink if main disk is faster
ln -s /Volumes/FastSSD/_work_cache _work

# Or configure alternative path in runner
```

### Build Parallelization

For multi-core systems, enable parallel Maven builds:

```bash
export MAVEN_OPTS="$MAVEN_OPTS -T 1C"  # 1 thread per core
```

Or in pom.xml:

```xml
<properties>
  <maven.build.timestamp.format>yyyy-MM-dd'T'HH:mm:ss'Z'</maven.build.timestamp.format>
  <maven.compiler.source>21</maven.compiler.source>
  <maven.compiler.target>21</maven.compiler.target>
  <maven.compiler.parameters>true</maven.compiler.parameters>
  <!-- Parallel build configuration -->
  <maven.test.parallel>true</maven.test.parallel>
  <maven.test.parallelOptimized>true</maven.test.parallelOptimized>
  <maven.threadCount>2</maven.threadCount>
</properties>
```

## Monitoring & Logging

### System Monitoring

```bash
# Real-time monitoring (macOS)
Activity Monitor

# Command line (Linux)
htop
iotop
nethogs

# Check runner process
ps aux | grep -i runner
```

### Log Locations

- **macOS**: `/var/log/github-runner-*.log`
- **Linux**: `/var/log/` or `journalctl -u actions.runner.*`
- **Runner Logs**: `~/.runner-runner/_diag/`

### Enable Debug Logging

Set in runner service environment:

```
ACTIONS_RUNNER_DEBUG=true
ACTIONS_STEP_DEBUG=true
```

Then restart and check logs for verbose output.

## Maintenance Schedule

### Daily Tasks
- Verify runner is online: `github.com/settings/actions/runners`
- Monitor disk usage: `df -h`
- Check runner logs for errors

### Weekly Tasks
- Clean up Docker: `docker system prune`
- Refresh dependencies: `mvn dependency:go-offline`
- Review runner metrics

### Monthly Tasks
- Update Java: `brew upgrade openjdk@21`
- Update Maven: `brew upgrade maven`
- Update Docker: `brew upgrade docker`
- Rotate GitHub token (every 90 days)
- Archive old workflow logs

### Quarterly Tasks
- Major dependency updates
- Security scanning
- Performance benchmarking
- Disaster recovery testing

## Troubleshooting Environment Issues

### "Cannot find Java"

```bash
# Verify JAVA_HOME
echo $JAVA_HOME
$JAVA_HOME/bin/java -version

# Update in runner service config
# Then restart runner
```

### "Maven command not found"

```bash
# Add to PATH or configure M2_HOME
export M2_HOME=$(brew --prefix maven)
export PATH=$M2_HOME/bin:$PATH

# Or set in runner service environment
```

### "Docker daemon not accessible"

```bash
# Verify Docker is running and socket exists
ls -la /var/run/docker.sock

# Add user to docker group
sudo usermod -aG docker $USER

# Restart Docker
sudo systemctl restart docker
```

### "Not enough disk space"

```bash
# Check space
df -h

# Clean up
docker system prune -a --volumes
rm -rf ~/.m2/repository
cd _work && rm -rf */
```

## Related Documentation

- [GitHub Actions Runner Documentation](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Self-Hosted Runner Setup](./SELF_HOSTED_RUNNER_SETUP.md)
- [Test Quality Gates Workflow](./test-quality-gates.yml)

---

**Last Updated**: December 26, 2025
**Version**: 1.0
