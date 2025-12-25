# Sprint 19 Pre-Deployment Verification - SECTION 2
## Development Environment Verification Guide

**Section**: 2 of 9
**Items**: 6 critical items
**Due Date**: December 27, 2025
**Risk Level**: 🔴 CRITICAL (blocks all development if incomplete)
**Status**: 🟡 Ready for Verification

---

## Overview

This section verifies that all agents have working development environments capable of:
- Cloning and building V11 codebase
- Running Quarkus in dev mode with hot reload
- Running unit tests
- Connecting to PostgreSQL database
- IDE configuration

---

## ✅ Item 2.1: V11 Codebase Setup

**What to Verify**: Repository cloned, on correct branch, Maven clean build succeeds

**Prerequisites**:
- Section 1 (Credentials) completed
- Git installed: `git --version` (should be 2.30+)
- Maven installed: `mvn --version` or `./mvnw --version` (Java 21 required)

**Verification Steps**:

```bash
# Step 1: Check if repository already cloned
if [ -d ~/Aurigraph-DLT ]; then
  echo "✓ Repository already cloned"
  cd ~/Aurigraph-DLT
else
  echo "→ Cloning repository..."
  git clone git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git ~/Aurigraph-DLT
  cd ~/Aurigraph-DLT
fi

# Step 2: Verify correct branch (should be V12)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"
if [ "$CURRENT_BRANCH" != "V12" ]; then
  echo "→ Switching to V12 branch..."
  git checkout V12
  git pull origin V12
fi

# Step 3: Navigate to V11 standalone
cd aurigraph-av10-7/aurigraph-v11-standalone

# Step 4: Check Java version (must be 21+)
JAVA_VERSION=$(java -version 2>&1 | grep 'version' | head -1)
echo "Java version: $JAVA_VERSION"
if [[ ! $JAVA_VERSION =~ "21" ]] && [[ ! $JAVA_VERSION =~ "22" ]] && [[ ! $JAVA_VERSION =~ "23" ]]; then
  echo "⚠ WARNING: Java 21+ required"
  echo "  Current Java: $JAVA_VERSION"
  echo "  Set JAVA_HOME: export JAVA_HOME=/path/to/java21"
fi

# Step 5: Clean compile (builds without running tests)
echo "→ Running Maven clean compile..."
./mvnw clean compile

# Expected output:
# [INFO] BUILD SUCCESS
# Total time: XX.XXXs
```

**Checklist**:
- [ ] Git clone succeeds or repository already exists
- [ ] Branch is V12 (or correct dev branch)
- [ ] Java version is 21+
- [ ] `./mvnw clean compile` completes with BUILD SUCCESS
- [ ] No compilation errors in V11 codebase

**If Verification Fails**:

```bash
# Issue: BUILD FAILURE with compilation errors
# Solution: Check for missing dependencies or Java version issues
./mvnw clean dependency:resolve

# Issue: Java version wrong
# Solution: Set JAVA_HOME to Java 21
export JAVA_HOME=/opt/homebrew/opt/openjdk@21  # macOS
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk  # Linux
java -version  # Verify
./mvnw clean compile

# Issue: Slow first build (downloading dependencies)
# Solution: This is normal, may take 2-3 minutes first time
# Subsequent builds will be faster
```

**Notes**: _______________________

---

## ✅ Item 2.2: Quarkus Dev Mode Startup

**What to Verify**: Quarkus dev mode starts and listens on port 9003

**Verification Steps**:

```bash
# From aurigraph-av10-7/aurigraph-v11-standalone directory

# Step 1: Start Quarkus dev mode
echo "→ Starting Quarkus dev mode (this takes 15-30 seconds)..."
./mvnw quarkus:dev

# Watch for output:
# INFO  [io.quarkus] (Quarkus Main Thread) Quarkus X.XX.X on JVM started in X.XXXs
# INFO  [io.quarkus] (Quarkus Main Thread) Listening on: http://localhost:9003
# INFO  [io.quarkus] (Quarkus Main Thread) Profile dev activated.

# Step 2: In ANOTHER terminal, verify the service is responding
sleep 5  # Wait for server to fully start
curl -s http://localhost:9003/q/health | jq '.'

# Expected output:
# {
#   "status": "UP",
#   "checks": [...]
# }

# Step 3: Check metrics endpoint
curl -s http://localhost:9003/q/metrics | head -20

# Step 4: Kill the dev mode process
# Press Ctrl+C in the Quarkus terminal

echo "✓ Quarkus dev mode working"
```

**Checklist**:
- [ ] Quarkus dev mode starts without errors
- [ ] Listens on http://localhost:9003
- [ ] Health endpoint returns status=UP
- [ ] Metrics endpoint available
- [ ] Can kill process cleanly with Ctrl+C

**Expected Timeline**: 15-30 seconds from `./mvnw quarkus:dev` to "Listening on: http://localhost:9003"

**If Verification Fails**:

```bash
# Issue: Port 9003 already in use
# Solution: Kill process using port
lsof -i :9003
kill -9 <PID>

# Issue: OutOfMemoryError during startup
# Solution: Increase JVM heap size
export MAVEN_OPTS="-Xmx1g"
./mvnw quarkus:dev

# Issue: "Failed to load PostgreSQL driver"
# Solution: Database not configured or running
# See Item 2.4 below

# Issue: Slow startup (>1 minute)
# Solution: First startup is slow due to dependency loading
# Subsequent startups are faster (~15-30 sec)
```

**Notes**: _______________________

---

## ✅ Item 2.3: Unit Tests Pass

**What to Verify**: All unit tests pass without failures

**Verification Steps**:

```bash
# From aurigraph-av10-7/aurigraph-v11-standalone directory

# Step 1: Run all unit tests
echo "→ Running unit tests (this takes 2-5 minutes)..."
./mvnw test

# Watch for output showing test execution
# [INFO] Tests run: XX, Failures: 0, Errors: 0, Skipped: 0

# Step 2: Verify BUILD SUCCESS
# Output should end with:
# [INFO] BUILD SUCCESS
# Total time: X.XXXs

# Step 3: Check test coverage report (optional)
./mvnw test jacoco:report

# View coverage report at:
# target/site/jacoco/index.html
```

**Checklist**:
- [ ] `./mvnw test` completes without errors
- [ ] No test failures reported
- [ ] BUILD SUCCESS at end
- [ ] Test execution time reasonable (<5 minutes)
- [ ] At least 10+ test classes executed

**Common Test Failures**:

```bash
# Issue: "Connection refused" errors in integration tests
# Solution: PostgreSQL database not running
# See Item 2.4 below

# Issue: "Test method took too long" timeouts
# Solution: System too slow or database performance issue
# Can increase timeout in pom.xml if needed:
# <maven.surefire.timeout>120000</maven.surefire.timeout>

# Issue: Random test failures (flaky tests)
# Solution: Run tests multiple times
./mvnw test -Dtest=TransactionServiceTest#testHighThroughput -DfailIfNoTests=false
# Run 3 times to see if failures are consistent
```

**Notes**: _______________________

---

## ✅ Item 2.4: PostgreSQL Database Setup

**What to Verify**:
- PostgreSQL server running on localhost:5432
- Database "aurigraph" exists
- All tables created via Liquibase migration
- V11 application can connect

**Verification Steps**:

```bash
# Step 1: Check if PostgreSQL is running
echo "→ Checking PostgreSQL..."
psql --version
# Expected: psql (PostgreSQL) 16.X

# If not installed:
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql postgresql-contrib
# Windows: Download installer from postgresql.org

# Step 2: Start PostgreSQL server
# macOS with brew:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Check status:
psql -U postgres -d postgres -c "SELECT version();"

# Step 3: Check if "aurigraph" database exists
PGPASSWORD=aurigraph psql -h localhost -U aurigraph -d aurigraph -c "SELECT 1;"

# If database doesn't exist:
PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE aurigraph;"
PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE USER aurigraph WITH PASSWORD 'aurigraph';"
PGPASSWORD=postgres psql -h localhost -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE aurigraph TO aurigraph;"

# Step 4: Verify all tables exist
PGPASSWORD=aurigraph psql -h localhost -U aurigraph -d aurigraph -c "\dt"

# Expected tables:
# - transactions
# - consensus_state
# - rwa_tokens
# - bridge_state

# Step 5: Verify schema is initialized
PGPASSWORD=aurigraph psql -h localhost -U aurigraph -d aurigraph -c "
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;"

# Should return 4+ tables

# Step 6: Verify primary keys and indexes
PGPASSWORD=aurigraph psql -h localhost -U aurigraph -d aurigraph -c "\di+"
```

**Checklist**:
- [ ] PostgreSQL server installed and running
- [ ] Can connect with psql client
- [ ] Database "aurigraph" exists
- [ ] User "aurigraph" has proper permissions
- [ ] At least 4 main tables created (transactions, consensus_state, rwa_tokens, bridge_state)
- [ ] Indexes created for performance

**PostgreSQL Configuration**:

```bash
# Check PostgreSQL config (if needed)
sudo find /etc/postgresql -name "postgresql.conf" 2>/dev/null

# Key settings for development:
# max_connections = 200 (default usually fine)
# shared_buffers = 256MB (default)
# effective_cache_size = 1GB

# If you need to modify:
# Edit /etc/postgresql/16/main/postgresql.conf
# Then: sudo systemctl restart postgresql
```

**If Verification Fails**:

```bash
# Issue: PostgreSQL service not running
# Solution:
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux

# Issue: Database doesn't exist
# Solution: Create it
createdb -U postgres aurigraph

# Issue: User doesn't have permissions
# Solution: Grant permissions
PGPASSWORD=postgres psql -h localhost -U postgres -d aurigraph \
  -c "GRANT ALL ON SCHEMA public TO aurigraph;"

# Issue: Tables don't exist (Liquibase not run)
# Solution: Run Liquibase migration via Quarkus
# When you start Quarkus dev mode, Liquibase runs automatically
./mvnw quarkus:dev
# Check logs for "Liquibase migrations completed"
```

**Notes**: _______________________

---

## ✅ Item 2.5: IDE Configuration

**What to Verify**: IDE properly configured with Maven, formatter, and Git

**For IntelliJ IDEA**:

```bash
# Step 1: Open project
# File → Open → Select Aurigraph-DLT folder

# Step 2: Verify Maven is recognized
# File → Settings → Build, Execution, Deployment → Build Tools → Maven
# Maven home path should be set (or use bundled)
# Project SDK should be Java 21+

# Step 3: Verify code formatter
# File → Settings → Editor → Code Style
# Should show scheme (e.g., "Default", "Aurigraph")

# Step 4: Test compilation
# Build → Make Project (Ctrl+F9)
# Should show "Build completed successfully"

# Step 5: Verify Git is recognized
# VCS → Git → Fetch (Ctrl+Shift+K)
# Should work without errors
```

**For VS Code**:

```bash
# Step 1: Install extensions
# Extensions → Search "Extension Pack for Java"
# Install: Extension Pack for Java, Maven for Java, Spring Boot Extension Pack

# Step 2: Verify Maven
# Ctrl+Shift+P → "Java: Configure Java Runtime"
# Should show Java 21+

# Step 3: Test build
# Ctrl+Shift+P → "Java: Build Project"
# Should complete without errors

# Step 4: Open terminal and test Git
# Terminal → New Terminal
# git status
# Should show current branch
```

**Git Configuration**:

```bash
# Verify Git configuration
git config --global user.name
git config --global user.email

# If not set:
git config --global user.name "Agent Name"
git config --global user.email "agent@aurigraph.io"

# Verify configuration is correct
git config --global --list | grep user
```

**Checklist**:
- [ ] IDE installed (IntelliJ IDEA or VS Code with Java extensions)
- [ ] Maven configured and recognized
- [ ] Java 21+ selected as SDK
- [ ] Code formatter configured
- [ ] Git user name and email set globally
- [ ] Can run "Make Project" / "Build Project" without errors

**Notes**: _______________________

---

## ✅ Item 2.6: Development Tools Summary

**What to Verify**: All development tools are installed and working

**Verification Command** (run once):

```bash
#!/bin/bash
echo "═════════════════════════════════════════════════"
echo "Development Environment Verification Summary"
echo "═════════════════════════════════════════════════"

echo "1. Git:"
git --version

echo ""
echo "2. Java:"
java -version

echo ""
echo "3. Maven:"
./mvnw --version

echo ""
echo "4. PostgreSQL:"
psql --version

echo ""
echo "5. IDE (check one):"
which idea || echo "  IntelliJ IDEA not found in PATH"
which code || echo "  VS Code not found in PATH"

echo ""
echo "6. Other tools:"
docker --version 2>/dev/null || echo "  Docker not found (optional)"
curl --version 2>/dev/null | head -1
jq --version 2>/dev/null || echo "  jq not found (optional)"

echo ""
echo "═════════════════════════════════════════════════"
echo "✓ Environment verification complete"
```

**Save as**: `scripts/verify-dev-environment.sh`

**Run**: `bash scripts/verify-dev-environment.sh`

**Expected Output**:
```
═════════════════════════════════════════════════
Development Environment Verification Summary
═════════════════════════════════════════════════
1. Git:
git version 2.43.0

2. Java:
openjdk version "21.0.1" 2023-10-17

3. Maven:
Apache Maven 3.9.5

4. PostgreSQL:
psql (PostgreSQL) 16.1

5. IDE (check one):
[Path to IntelliJ or VS Code]

6. Other tools:
curl 8.1.2 (x86_64-apple-darwin23.1.0)

═════════════════════════════════════════════════
✓ Environment verification complete
```

**Notes**: _______________________

---

## 📊 SECTION 2 VERIFICATION CHECKLIST

| Item | Verification | Pass/Fail | Date | Notes |
|------|--------------|-----------|------|-------|
| 2.1 | V11 Codebase cloned, branch V12, Maven compile | ☐ | | |
| 2.2 | Quarkus dev mode starts on port 9003 | ☐ | | |
| 2.3 | Unit tests run successfully (0 failures) | ☐ | | |
| 2.4 | PostgreSQL running, database exists, tables created | ☐ | | |
| 2.5 | IDE configured (Maven, Java 21+, Git) | ☐ | | |
| 2.6 | All dev tools installed and working | ☐ | | |
| **SECTION 2 TOTAL** | **6 items** | **0/6** | | |

---

## 🔄 Verification Timeline

**Dec 26 (Tomorrow)**: Sections 1-2 (13 items total, ~3 hours)
- Section 1 credentials: 30-45 mins
- Section 2 dev environment: 1.5-2 hours

**Dec 27**: Section 1 & 2 completion + Section 3 start
**Dec 28**: Sections 3-4
**Dec 29**: Section 5
**Dec 30**: Sections 6-8
**Dec 31**: Section 9 + Final sign-off

---

## 💡 Time-Saving Tips

**Parallel Setup**: While Section 1 credentials are being verified, Section 2 can happen in parallel:
- Clone repository while testing JIRA token
- Start PostgreSQL while Git SSH is being tested
- Install IDE while database is initializing

**Quick Iteration**: Each Section 2 item can be verified quickly:
- Maven compile: 2-3 mins (subsequent builds faster)
- Quarkus startup: 15-30 secs
- Unit tests: 2-5 mins
- PostgreSQL: 1-2 mins
- IDE: 5 mins

**Total Section 2 Time**: ~20-30 minutes if everything is ready

---

**Generated**: December 25, 2025
**For**: Aurigraph V11 Migration - Sprint 19 Pre-Deployment
**Status**: Ready for verification starting Dec 26

