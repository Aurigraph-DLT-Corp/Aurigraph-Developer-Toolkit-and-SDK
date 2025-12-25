# Sprint 19 Contingency Procedures

**Version**: 1.0
**Last Updated**: December 25, 2025
**Status**: ✅ Ready for use

---

## Executive Summary

This document provides step-by-step procedures for common failures during Sprint 19 verification execution (Dec 26-31). Each contingency includes:
- **Severity**: Impact on timeline
- **Detection**: How to identify the issue
- **Root Causes**: Why this might happen
- **Quick Fix**: 5-10 minute resolution (if possible)
- **Deep Fix**: Complete resolution (20+ minutes)
- **Escalation Path**: Who to contact if stuck
- **Timeline Impact**: How much delay this causes

---

## Contingency Matrix

| Issue | Severity | Quick Fix Time | Full Fix Time | Escalation |
|-------|----------|----------------|---------------|------------|
| GitHub SSH fails | HIGH | 5 min | 15 min | GitHub Admin (1h) |
| JIRA token invalid | HIGH | 10 min | 20 min | JIRA Admin (2h) |
| V10 SSH fails | MEDIUM | 10 min | 30 min | V10 DevOps (2h) |
| V10 API down | HIGH | 0 min | 60 min | V10 DevOps (4h) |
| Database connection fails | MEDIUM | 5 min | 30 min | Database Admin (30m) |
| Quarkus won't start | HIGH | 10 min | 60 min | Tech Lead (2h) |
| Maven build fails | MEDIUM | 10 min | 45 min | Tech Lead (2h) |
| Unit tests fail | LOW | 15 min | 120 min | QA Lead (4h) |
| Gatling missing | LOW | 5 min | 5 min | Self-service |
| Keycloak unreachable | MEDIUM | 0 min | 60 min | Keycloak Admin (4h) |

---

# CONTINGENCY #1: GitHub SSH Authentication Fails

## Detection

**Error Message**:
```
✗ FAIL - SSH key not registered with GitHub
Response: Permission denied (publickey)
```

**Or**:
```
Permission denied (publickey).
fatal: Could not read from remote repository.
```

---

## Severity: HIGH
- **Impact**: Cannot push code, test automation, deployment blocked
- **Timeline Impact**: +30 minutes
- **Recovery SLA**: 1 hour (GitHub Admin)
- **Blockers**: Sprint 19 cannot proceed without this

---

## Quick Diagnosis (1 minute)

```bash
# Test 1: Check if SSH key exists
ls -la ~/.ssh/id_rsa ~/.ssh/id_ed25519 2>/dev/null || echo "No SSH key found"

# Test 2: Check SSH agent
ssh-add -l
# Expected: Should list your key (ends with your email)

# Test 3: Verbose SSH test
ssh -vvv git@github.com 2>&1 | grep -i "authentication\|permission"
```

---

## Probable Root Causes

1. **SSH key not generated** (most common)
   - You've never run `ssh-keygen`
   - Fix time: 2 minutes

2. **SSH key not registered with GitHub** (most common)
   - Key exists locally but not in GitHub account
   - Fix time: 3 minutes

3. **SSH key permissions wrong**
   - Private key is world-readable (600 required)
   - Fix time: 1 minute

4. **SSH agent not running**
   - macOS/Linux SSH agent not initialized
   - Fix time: 2 minutes

5. **GitHub SSH server unreachable**
   - Network issue (rare)
   - Fix time: Network team needed

---

## Quick Fix (5-10 minutes)

### Fix Option 1: SSH Key Doesn't Exist

```bash
# Step 1: Generate new SSH key
ssh-keygen -t ed25519 -C "your-email@company.com" -f ~/.ssh/id_github

# Step 2: Add to SSH agent
ssh-add ~/.ssh/id_github

# Step 3: Copy public key
cat ~/.ssh/id_github.pub | pbcopy  # macOS
# Or: cat ~/.ssh/id_github.pub (and manually copy)

# Step 4: Add to GitHub
# Visit: https://github.com/settings/keys
# Click "New SSH key"
# Title: "Aurigraph Development"
# Paste public key content
# Click "Add SSH key"

# Step 5: Test
ssh -T git@github.com
# Expected: Hi [username]! You've successfully authenticated...
```

**Duration**: ~5 minutes (includes manual GitHub steps)

---

### Fix Option 2: SSH Key Not Registered

```bash
# Step 1: Check what GitHub has registered
# Visit: https://github.com/settings/keys
# Look for your key in the list

# Step 2: If key missing, get public key
cat ~/.ssh/id_rsa.pub
# Or: cat ~/.ssh/id_ed25519.pub

# Step 3: Add to GitHub
# Visit: https://github.com/settings/keys
# Click "New SSH key"
# Title: "Aurigraph Development"
# Paste the public key
# Click "Add SSH key"

# Step 4: Test (wait 30 seconds for propagation)
sleep 30
ssh -T git@github.com
```

**Duration**: ~3 minutes

---

### Fix Option 3: SSH Key Permissions Wrong

```bash
# Check permissions
ls -la ~/.ssh/id_*
# Should show:
# - Private key: -rw------- (600)
# - Public key:  -rw-r--r-- (644)

# Fix if wrong
chmod 600 ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_*.pub

# Test
ssh -T git@github.com
```

**Duration**: ~1 minute

---

### Fix Option 4: SSH Agent Not Running (macOS)

```bash
# Start SSH agent
eval "$(ssh-agent -s)"

# Add key
ssh-add ~/.ssh/id_rsa
# Or: ssh-add ~/.ssh/id_ed25519

# Verify
ssh-add -l
# Should list your key

# Test
ssh -T git@github.com
```

**Duration**: ~2 minutes

---

## Deep Fix (if quick fix doesn't work)

```bash
# Step 1: Start fresh - backup old key
mv ~/.ssh/id_rsa ~/.ssh/id_rsa.backup
mv ~/.ssh/id_rsa.pub ~/.ssh/id_rsa.pub.backup

# Step 2: Generate new ED25519 key (more modern)
ssh-keygen -t ed25519 -C "your-email@company.com" -N "" -f ~/.ssh/id_ed25519

# Step 3: Configure SSH config
cat > ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes
    IdentitiesOnly yes
EOF

# Step 4: Set permissions
chmod 600 ~/.ssh/config
chmod 700 ~/.ssh

# Step 5: Add to SSH agent
ssh-add ~/.ssh/id_ed25519

# Step 6: Verify in agent
ssh-add -l

# Step 7: Copy and add to GitHub
cat ~/.ssh/id_ed25519.pub | pbcopy  # macOS
# Visit https://github.com/settings/keys and paste

# Step 8: Test after 30 second wait
sleep 30
ssh -vvv git@github.com

# Step 9: Test git clone
git clone git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git /tmp/test-clone
# If successful, delete the test clone: rm -rf /tmp/test-clone
```

**Duration**: ~15-20 minutes

---

## When to Escalate

**Escalate to GitHub Org Admin if**:
- Steps above don't work
- SSH key is registered but still fails
- Multiple users affected

**Escalation Process**:
1. Save verbose output: `ssh -vvv git@github.com > /tmp/ssh-debug.txt 2>&1`
2. Email GitHub Admin with:
   - Error output
   - Username
   - SSH key fingerprint: `ssh-keygen -l -f ~/.ssh/id_ed25519.pub`
3. SLA: 1 hour response

**GitHub Admin Contact**:
- Name: [FROM TEAM CONTACTS]
- Email: [FROM TEAM CONTACTS]
- Slack: #github-support

---

## Prevention

Add to team onboarding checklist:
- [ ] SSH key generated before development starts
- [ ] SSH key registered with GitHub
- [ ] SSH connection tested: `ssh -T git@github.com`

---

# CONTINGENCY #2: JIRA API Token Invalid

## Detection

**Error Message**:
```
✗ FAIL - 401 Unauthorized (invalid token)
Response: {"errorMessages":["Expiring or expired JIRA token"]}
```

**Or**:
```
{"errorMessages":["Incorrect Atlassian account credentials"]}
```

---

## Severity: HIGH
- **Impact**: Cannot update JIRA tickets, tracking broken
- **Timeline Impact**: +20 minutes
- **Recovery SLA**: 2 hours (JIRA Admin)
- **Dependencies**: Sprint tracking and sprint sign-off

---

## Quick Diagnosis (2 minutes)

```bash
# Test 1: Check if token is set
echo ${JIRA_TOKEN_DEPLOYMENT:0:10}... | wc -c
# Should show token is loaded (non-zero length)

# Test 2: Try API call
curl -u "deployment-agent@aurigraph.io:${JIRA_TOKEN_DEPLOYMENT}" \
  https://aurigraphdlt.atlassian.net/rest/api/3/myself | jq '.displayName'
# Expected: Should show display name
```

---

## Root Causes

1. **Token expired** (most common)
   - JIRA tokens expire after 90 days
   - Check Credentials.md creation date
   - Fix time: 3 minutes (regenerate)

2. **Token revoked** (common)
   - User revoked access manually
   - User removed from project
   - Fix time: 5 minutes

3. **Wrong token loaded**
   - Loaded wrong agent's token
   - Missing from Credentials.md
   - Fix time: 2 minutes

4. **JIRA account locked**
   - Too many login attempts
   - User deactivated
   - Fix time: JIRA Admin needed

---

## Quick Fix (5-10 minutes)

### Fix Option 1: Regenerate Token (Most Likely)

```bash
# Step 1: Visit Atlassian account management
# URL: https://id.atlassian.com/manage-profile/security/api-tokens

# Step 2: Log in with your Atlassian account
# Account: deployment-agent@aurigraph.io (or your agent email)

# Step 3: Click "Create API token"
# Name: "Aurigraph Sprint 19 Deployment"
# Description: "For automated verification"

# Step 4: Copy the new token
# (Will only show once!)

# Step 5: Update Credentials.md
# Edit: ~/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md
# Find: JIRA_TOKEN_DEPLOYMENT=[old-token]
# Replace with: JIRA_TOKEN_DEPLOYMENT=[new-token]
# Save file

# Step 6: Load new token
export JIRA_TOKEN_DEPLOYMENT="[new-token-pasted-here]"

# Step 7: Test
curl -u "deployment-agent@aurigraph.io:${JIRA_TOKEN_DEPLOYMENT}" \
  https://aurigraphdlt.atlassian.net/rest/api/3/myself | jq '.displayName'
# Expected: Should show your display name
```

**Duration**: ~5-10 minutes (includes Atlassian account login)

---

### Fix Option 2: Check Token Loading

```bash
# Step 1: Verify credentials file exists
ls -l ~/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md
# Should show file exists

# Step 2: Extract token
JIRA_TOKEN=$(grep 'JIRA_TOKEN_DEPLOYMENT=' ~/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md | cut -d'=' -f2)

# Step 3: Verify it's loaded
echo "Token loaded: ${JIRA_TOKEN:0:10}..."

# Step 4: Test with this token
curl -u "deployment-agent@aurigraph.io:${JIRA_TOKEN}" \
  https://aurigraphdlt.atlassian.net/rest/api/3/myself

# Step 5: If it works, export it
export JIRA_TOKEN_DEPLOYMENT="${JIRA_TOKEN}"
```

**Duration**: ~2 minutes

---

## Deep Fix (Comprehensive Troubleshooting)

```bash
# Step 1: Verify account can log in to Atlassian
# Visit: https://aurigraphdlt.atlassian.net
# Log in with: deployment-agent@aurigraph.io
# If fails: Account is locked or disabled

# Step 2: Check JIRA admin console
# URL: https://aurigraphdlt.atlassian.net/secure/project/BrowseProjects.jspa
# Verify: Your account has AV11 project access

# Step 3: If account is disabled, ask admin to re-enable
# Admin: [JIRA Admin Contact]

# Step 4: Check account security settings
# Visit: https://id.atlassian.com/manage-profile/security
# Look for "Two-Factor Authentication" - if enabled, verify it's set up correctly

# Step 5: Create new token with explicit scopes
# Visit: https://id.atlassian.com/manage-profile/security/api-tokens
# Delete old token first (optional)
# Click "Create API token"
# Name: "Aurigraph-Sprint19-Verification-$(date +%Y%m%d)"
# Use this token

# Step 6: Update in Credentials.md and reload
export JIRA_TOKEN_DEPLOYMENT="[new-token]"

# Step 7: Test exhaustively
echo "Test 1: Basic auth check"
curl -u "deployment-agent@aurigraph.io:${JIRA_TOKEN_DEPLOYMENT}" \
  https://aurigraphdlt.atlassian.net/rest/api/3/myself -w "\nHTTP Status: %{http_code}\n"

echo "Test 2: Get AV11 project info"
curl -u "deployment-agent@aurigraph.io:${JIRA_TOKEN_DEPLOYMENT}" \
  https://aurigraphdlt.atlassian.net/rest/api/3/project/AV11 -w "\nHTTP Status: %{http_code}\n"

echo "Test 3: List sprint 19 issues"
curl -u "deployment-agent@aurigraph.io:${JIRA_TOKEN_DEPLOYMENT}" \
  'https://aurigraphdlt.atlassian.net/rest/api/3/search?jql=project=AV11 AND sprint=Sprint19' \
  -w "\nHTTP Status: %{http_code}\n"
```

**Duration**: ~20-30 minutes

---

## When to Escalate

**Escalate to JIRA Admin if**:
- Token regeneration doesn't work
- Account is locked or disabled
- User needs AV11 project access

**Escalation Process**:
1. Document the error: `curl ... > /tmp/jira-error.txt 2>&1`
2. Note the account email and agent name
3. Email JIRA Admin with:
   - Error details
   - Account email
   - Agent name
   - Sprint deadline (Dec 31)
4. SLA: Same day (4 hours)

**JIRA Admin Contact**:
- From JIRA Settings page: https://aurigraphdlt.atlassian.net/secure/project/admin
- Or contact: [FROM TEAM CONTACTS]

---

# CONTINGENCY #3: V10 SSH Access Fails

## Detection

**Error Message**:
```
✗ FAIL - SSH connection failed
Error: Permission denied (password).
```

**Or**:
```
ssh: connect to host dlt.aurigraph.io port 2235: Connection timed out
```

---

## Severity: MEDIUM
- **Impact**: Cannot access V10 deployment host
- **Timeline Impact**: +30 minutes (if temporary)
- **Recovery SLA**: 2 hours (V10 DevOps)
- **Workaround**: Can skip this check if V10 API works

---

## Quick Diagnosis (2 minutes)

```bash
# Test 1: Check if host is reachable
ping -c 3 dlt.aurigraph.io
# Should show responses

# Test 2: Check if port is open
nc -zv dlt.aurigraph.io 2235
# Or: telnet dlt.aurigraph.io 2235

# Test 3: Try verbose SSH
ssh -v -p 2235 subbu@dlt.aurigraph.io
# Watch for: Connection refused, timeout, or permission denied

# Test 4: Check if password is set
test -n "$V10_PASSWORD" && echo "Password set" || echo "Password NOT set"
```

---

## Root Causes

1. **Password not loaded** (most common)
   - V10_PASSWORD environment variable not set
   - Credentials.md missing or not extracted
   - Fix time: 1 minute

2. **Wrong password** (common)
   - Password changed but not updated in Credentials.md
   - Wrong agent's password loaded
   - Fix time: 5 minutes

3. **Network issue** (occasional)
   - Firewall blocking port 2235
   - SSH server down on host
   - Fix time: 0 minutes (network team)

4. **Host SSH service down**
   - Rare but possible
   - Fix time: DevOps team needed

---

## Quick Fix (5-15 minutes)

### Fix Option 1: Load Password (Most Likely)

```bash
# Step 1: Extract password from Credentials.md
CREDS_FILE="$HOME/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md"
V10_PASSWORD=$(grep 'V10_PASSWORD' "$CREDS_FILE" | grep -v '#' | cut -d'=' -f2)

# Step 2: Verify it's loaded
echo "Password loaded: ${V10_PASSWORD:0:3}***"

# Step 3: Set environment variable
export V10_PASSWORD

# Step 4: Test SSH connection
ssh -p 2235 subbu@dlt.aurigraph.io "echo 'SSH OK'"
# Expected: "SSH OK" is printed
```

**Duration**: ~2 minutes

---

### Fix Option 2: Manual SSH Test

```bash
# Step 1: If password not set, try interactive SSH
ssh -p 2235 subbu@dlt.aurigraph.io
# When prompted for password, enter: [from Credentials.md]

# Step 2: Once logged in, test basic command
echo "SSH works"
exit

# Step 3: If successful, reload Credentials.md script
export V10_PASSWORD="[password-from-file]"
```

**Duration**: ~3 minutes

---

### Fix Option 3: Check Network Connectivity First

```bash
# Step 1: Check if host is reachable
ping -c 3 dlt.aurigraph.io
# If fails: Network issue, contact network team

# Step 2: Check if SSH port is open
nmap -p 2235 dlt.aurigraph.io 2>/dev/null | grep -i open
# Or: nc -zv dlt.aurigraph.io 2235
# If fails: Port blocked, contact network team

# Step 3: Check firewall rules (macOS)
sudo pfctl -s nat
# Or on Linux: sudo iptables -L -n

# Step 4: If blocked, try different port or contact admin
# Try alternate: ssh -p 22 subbu@dlt.aurigraph.io (less likely)
```

**Duration**: ~5 minutes

---

## When to Escalate

**Escalate to V10 DevOps if**:
- Password doesn't work
- Network connectivity fails
- SSH port is blocked

**Escalation Process**:
1. Collect diagnostic info:
   ```bash
   ping dlt.aurigraph.io
   nmap -p 2235 dlt.aurigraph.io
   ssh -v -p 2235 subbu@dlt.aurigraph.io 2>&1 | tail -10
   ```
2. Email V10 DevOps with:
   - Error output
   - Hostname: dlt.aurigraph.io
   - Port: 2235
   - User: subbu
   - Current time/date
3. SLA: 2 hours

**DevOps Contact**:
- From team list: [FROM TEAM CONTACTS]
- Slack channel: #v10-operations

---

# CONTINGENCY #4: V10 API Endpoint Down

## Detection

**Error Message**:
```
✗ FAIL - 503 Service Unavailable
```

**Or**:
```
curl: (7) Failed to connect to v10-api.aurigraph.io port 443
```

---

## Severity: HIGH
- **Impact**: Cannot verify V10 service health
- **Timeline Impact**: +60+ minutes (if requires restart)
- **Recovery SLA**: 4 hours (V10 DevOps)
- **Critical**: If V10 is down, Sprint 19 coordination blocked

---

## Quick Diagnosis (1 minute)

```bash
# Test 1: Check if API is reachable
curl -I https://v10-api.aurigraph.io/api/v10/health
# Expected: HTTP 200

# Test 2: Check all V10 endpoints
curl -I https://v10-api.aurigraph.io/api/v10/
curl -I https://v10-api.aurigraph.io/health
curl -I https://dlt.aurigraph.io/api/v10/health

# Test 3: Check DNS resolution
nslookup v10-api.aurigraph.io
dig v10-api.aurigraph.io

# Test 4: Check token validity (if API responds)
curl -H "Authorization: Bearer ${V10_TOKEN}" \
  https://v10-api.aurigraph.io/api/v10/health
```

---

## Root Causes

1. **V10 service crashed** (most common)
   - Application process died
   - Out of memory
   - Unhandled exception
   - Fix time: DevOps needs to restart (~5 mins)

2. **Network connectivity issue** (common)
   - DNS resolution problem
   - Firewall blocking
   - ISP network issue
   - Fix time: 15-30 minutes

3. **Database connection lost** (occasional)
   - PostgreSQL down
   - Connection pool exhausted
   - Fix time: 10-20 minutes

4. **Kubernetes pod eviction** (if K8s deployed)
   - Pod restarting repeatedly
   - Fix time: Needs pod restart

---

## Immediate Actions

```bash
# Step 1: Check if this is a temporary issue
for i in {1..3}; do
  curl -s -w "\n%{http_code}\n" https://v10-api.aurigraph.io/api/v10/health
  sleep 5
done
# If one succeeds: Temporary blip, no action needed
# If all fail: Real outage

# Step 2: Check V10 health endpoint on alternate domain
curl -I https://dlt.aurigraph.io/api/v10/health 2>/dev/null || echo "Alternate domain also down"

# Step 3: Check DNS is resolving correctly
host v10-api.aurigraph.io
# Should resolve to IP address

# Step 4: Check network connectivity to host
ping -c 3 v10-api.aurigraph.io
# Should show responses
```

---

## When to Escalate Immediately

**Escalate to V10 DevOps IMMEDIATELY if**:
- API is consistently down (>1 minute)
- Multiple endpoints unreachable
- Network connectivity verified but service down
- This is blocking verification execution

**Escalation Process**:
1. Check status page: [if available]
2. Post in #v10-operations Slack with:
   - Issue: "V10 API down at [time]"
   - Error: curl output
   - Impact: "Blocking Sprint 19 verification"
   - Frequency: "Continuous since [time]"
3. Email to V10 DevOps immediately
4. SLA: 1 hour first response (should be faster - incident)

**Emergency Contacts**:
- V10 Ops Lead: [FROM TEAM CONTACTS]
- On-Call: [FROM TEAM CONTACTS]
- Slack: @v10-ops-oncall

---

# CONTINGENCY #5: Database Connection Fails

## Detection

**Error Message**:
```
✗ FAIL - Database connection failed
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed:
Connection refused
```

**Or**:
```
FATAL: Ident authentication failed for user "aurigraph"
```

---

## Severity: MEDIUM
- **Impact**: Cannot run V11 tests, database verification blocked
- **Timeline Impact**: +30 minutes
- **Recovery SLA**: 30 minutes (Database Admin)
- **Workaround**: Can defer database tests if critical path clear

---

## Quick Diagnosis (2 minutes)

```bash
# Test 1: Check if PostgreSQL is running
brew services list | grep postgres
# macOS: Should show "postgresql-15" running

# Test 2: Check if port 5432 is listening
lsof -i :5432
# Should show postgres process

# Test 3: Check if database exists
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U aurigraph -d aurigraph -c "SELECT 1;"

# Test 4: Check service status
pg_isready -h localhost -U aurigraph -d aurigraph
# Expected: "accepting connections"
```

---

## Root Causes

1. **PostgreSQL service not running** (most common)
   - Service stopped or crashed
   - Fix time: 1-2 minutes (start service)

2. **Wrong password** (common)
   - Password in Credentials.md is wrong
   - Database password was changed
   - Fix time: 5 minutes

3. **Database not created** (occasional)
   - Database initialization not run
   - Schema not applied
   - Fix time: 5-10 minutes

4. **Port already in use** (occasional)
   - Different PostgreSQL instance running
   - Other service on 5432
   - Fix time: 3 minutes

---

## Quick Fix (5-10 minutes)

### Fix Option 1: Start PostgreSQL (Most Likely)

**macOS**:
```bash
# Step 1: Check status
brew services list | grep postgresql

# Step 2: Start if not running
brew services start postgresql

# Step 3: Wait a few seconds
sleep 3

# Step 4: Check status again
brew services list | grep postgresql
# Should show "started"

# Step 5: Test connection
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U aurigraph -d aurigraph -c "SELECT 1;"
# Expected: (1 row) with result "1"
```

**Linux**:
```bash
# Step 1: Start service
sudo systemctl start postgresql

# Step 2: Check status
sudo systemctl status postgresql
# Should show "active (running)"

# Step 3: Test connection
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U aurigraph -d aurigraph -c "SELECT 1;"
```

**Duration**: ~2 minutes

---

### Fix Option 2: Check & Update Password

```bash
# Step 1: Get password from Credentials.md
CREDS_FILE="$HOME/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md"
DB_PASSWORD=$(grep 'DB_PASSWORD' "$CREDS_FILE" | grep -v '#' | cut -d'=' -f2)

# Step 2: Export it
export DB_PASSWORD

# Step 3: Test with new password
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U aurigraph -d aurigraph -c "SELECT 1;"

# Step 4: If that works, great! If not, try default
PGPASSWORD="aurigraph" psql -h localhost -U aurigraph -d aurigraph -c "SELECT 1;"

# Step 5: If default works, update Credentials.md with: DB_PASSWORD=aurigraph
```

**Duration**: ~2 minutes

---

### Fix Option 3: Find What's Using Port 5432

```bash
# Step 1: Check what's on port 5432
lsof -i :5432
# Should show postgres process, or nothing

# Step 2: If something else is using it
# Kill it (be careful!): kill -9 [PID]

# Step 3: Or use different port
psql -h localhost -p 5432 -U aurigraph -d aurigraph -c "SELECT 1;"
# If 5432 doesn't work, try:
psql -h localhost -p 5433 -U aurigraph -d aurigraph -c "SELECT 1;"
```

**Duration**: ~3 minutes

---

## Deep Fix (Comprehensive)

```bash
# Step 1: Stop PostgreSQL
brew services stop postgresql  # macOS

# Step 2: Check data directory
ls -la ~/Library/Application\ Support/postgresql/
# macOS location

# Step 3: Restart PostgreSQL from scratch
brew uninstall postgresql
brew install postgresql

# Step 4: Initialize database
initdb -D /usr/local/var/postgres  # macOS path may vary

# Step 5: Start service
brew services start postgresql

# Step 6: Create database if needed
createdb aurigraph

# Step 7: Create user if needed
psql -c "CREATE USER aurigraph WITH PASSWORD 'aurigraph';"

# Step 8: Grant privileges
psql -c "GRANT ALL PRIVILEGES ON DATABASE aurigraph TO aurigraph;"

# Step 9: Test
PGPASSWORD="aurigraph" psql -h localhost -U aurigraph -d aurigraph -c "SELECT 1;"
```

**Duration**: ~15 minutes (includes reinstallation)

---

## When to Escalate

**Escalate to Database Admin if**:
- PostgreSQL won't start after fixes
- Need to restore from backup
- Need password reset
- Data corruption suspected

**Database Admin Contact**:
- From team: [FROM TEAM CONTACTS]
- Slack: #database-support
- SLA: 30 minutes

---

# CONTINGENCY #6: Quarkus Won't Start

## Detection

**Error Message**:
```
✗ FAIL - Connection refused (service not running?)
```

**Or**:
```
[ERROR] Failed to start Quarkus
[ERROR] java.lang.UnsupportedClassVersionError: ... has been compiled by a more recent version
```

---

## Severity: HIGH
- **Impact**: Cannot verify V11 service, core platform blocked
- **Timeline Impact**: +60+ minutes
- **Recovery SLA**: 2 hours (Tech Lead)
- **Critical**: Core verification item

---

## Quick Diagnosis (2 minutes)

```bash
# Test 1: Check Java version
java --version
# Expected: openjdk version "21" or higher

# Test 2: Check if port 9003 is available
lsof -i :9003
# Expected: Nothing (port free)

# Test 3: Check Maven is available
./mvnw --version

# Test 4: Try to start Quarkus with more verbose output
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev -X 2>&1 | head -50
# Watch for ERROR messages
```

---

## Root Causes

1. **Java version too old** (very common)
   - Installed JDK is < 21
   - Wrong JAVA_HOME set
   - Fix time: 10 minutes (upgrade)

2. **Port 9003 already in use** (common)
   - Another Quarkus instance running
   - Another service on that port
   - Fix time: 2 minutes (kill process)

3. **Compilation error in code** (occasional)
   - Recent code change broke build
   - Dependency conflict
   - Fix time: 15-30 minutes (debug)

4. **Out of memory** (rare)
   - Maven/Java heap too small
   - System running low on RAM
   - Fix time: 5 minutes

---

## Quick Fix (5-15 minutes)

### Fix Option 1: Update Java Version (Most Likely)

```bash
# Step 1: Check current Java version
java --version
# If shows Java 17, 20, etc. - needs upgrade

# Step 2: Install Java 21 (macOS)
brew install openjdk@21

# Step 3: Set JAVA_HOME
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH=$JAVA_HOME/bin:$PATH

# Step 4: Verify
java --version
# Should show: openjdk version "21.xxx"

# Step 5: Persist JAVA_HOME (optional, add to ~/.zshrc or ~/.bash_profile)
echo 'export JAVA_HOME=/opt/homebrew/opt/openjdk@21' >> ~/.zshrc

# Step 6: Try starting Quarkus
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev
```

**Duration**: ~5-10 minutes (includes Homebrew download)

---

### Fix Option 2: Kill Process on Port 9003

```bash
# Step 1: Find what's using port 9003
lsof -i :9003
# Look for PID in output

# Step 2: Kill the process
kill -9 [PID]  # Use PID from step 1
# Or kill all Java processes: pkill -f java

# Step 3: Verify port is free
lsof -i :9003  # Should show nothing

# Step 4: Try starting Quarkus again
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev
```

**Duration**: ~1-2 minutes

---

### Fix Option 3: Clean Build & Restart

```bash
# Step 1: Stop any running Quarkus (CTRL+C in dev terminal)

# Step 2: Navigate to correct directory
cd ~/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Step 3: Clean and compile
./mvnw clean compile

# Step 4: Check for compilation errors
# Read output carefully - look for [ERROR]

# Step 5: Try dev mode again
./mvnw quarkus:dev

# Step 6: Watch for startup messages
# Should see: "Quarkus X.X.X started in X.XXXs"
```

**Duration**: ~10-15 minutes (depends on Maven download)

---

## Deep Debugging (if above doesn't work)

```bash
# Step 1: Try with verbose Maven output
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw -X quarkus:dev 2>&1 | tee /tmp/quarkus-debug.log

# Step 2: Look for errors
grep -i "ERROR\|FATAL\|FAIL" /tmp/quarkus-debug.log

# Step 3: Check heap memory
# If out of memory error, increase heap:
export MAVEN_OPTS="-Xmx2g"
./mvnw quarkus:dev

# Step 4: Check if specific test is failing
./mvnw clean test -Dtest=AurigraphResourceTest 2>&1 | tail -20

# Step 5: If tests fail, run with debugging
./mvnw clean test -X -Dtest=AurigraphResourceTest 2>&1 | grep -A5 "FAIL\|ERROR"
```

**Duration**: ~20-30 minutes

---

## When to Escalate

**Escalate to Tech Lead if**:
- Java version upgrade doesn't work
- Quarkus still won't start after clean build
- Compilation errors in source code

**Tech Lead Escalation**:
1. Save debug log: `/tmp/quarkus-debug.log`
2. Document:
   - Java version: `java --version`
   - Maven version: `./mvnw --version`
   - Port status: `lsof -i :9003`
   - Full error: Last 50 lines of build output
3. Slack: @tech-lead "Quarkus won't start - need help"
4. SLA: 2 hours

---

# CONTINGENCY #7: Maven Build Fails

## Detection

**Error Message**:
```
[ERROR] COMPILATION ERROR
[ERROR] ... cannot find symbol
```

**Or**:
```
[ERROR] BUILD FAILURE
[ERROR] Failed to execute goal ... (compilation)
```

---

## Severity: MEDIUM
- **Impact**: Cannot verify V11 compilation, development blocked
- **Timeline Impact**: +45 minutes
- **Recovery SLA**: 2 hours (Tech Lead)
- **Workaround**: Can defer if API endpoint test works

---

## Quick Diagnosis (3 minutes)

```bash
# Test 1: Check Java version first
java --version
# If not 21+, that's the problem

# Test 2: Check Maven version
./mvnw --version
# Should be 3.8+

# Test 3: Try clean and compile
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean compile 2>&1 | tail -30
# Look for [ERROR] or [FAIL]

# Test 4: Look at specific error
./mvnw clean compile 2>&1 | grep -A5 "\[ERROR\]"
```

---

## Root Causes

1. **Java version too old** (most common)
   - Java 17 or 20 when 21 required
   - Fix time: 10 minutes

2. **Missing dependencies** (common)
   - Repository unreachable
   - Corrupted local repository
   - Fix time: 5-10 minutes

3. **Syntax error in source code** (occasional)
   - Recent change introduced bug
   - Merge conflict not resolved
   - Fix time: 15-30 minutes

4. **Corrupted Maven cache** (rare)
   - ~/.m2 directory corrupted
   - Fix time: 5 minutes

---

## Quick Fix (5-15 minutes)

### Fix Option 1: Verify Java Version

```bash
# Step 1: Check
java --version

# Step 2: If not 21+, upgrade
brew install openjdk@21

# Step 3: Set JAVA_HOME
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH=$JAVA_HOME/bin:$PATH

# Step 4: Try build again
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean compile
```

**Duration**: ~5 minutes

---

### Fix Option 2: Clear Maven Cache

```bash
# Step 1: Navigate to project
cd aurigraph-av10-7/aurigraph-v11-standalone

# Step 2: Remove local repository
rm -rf ~/.m2/repository

# Step 3: Try build (will re-download all dependencies)
./mvnw clean compile
# This may take 10+ minutes on first run

# Step 4: Monitor download progress
# Should see: "[INFO] Downloading from repository..."
```

**Duration**: ~15-20 minutes (includes download)

---

### Fix Option 3: Check for Syntax Errors

```bash
# Step 1: Run compile with verbose output
./mvnw clean compile -X 2>&1 | grep -B5 -A5 "ERROR"

# Step 2: Look at error location
# Error will show: [path/to/File.java:XXX]
# Find and fix that file

# Step 3: If recent merge, check for conflicts
git diff --name-only

# Step 4: Check for merge conflict markers
grep -r "<<<<<" aurigraph-av10-7/aurigraph-v11-standalone/src/

# Step 5: Try build again
./mvnw clean compile
```

**Duration**: ~10-15 minutes (depends on bug complexity)

---

## When to Escalate

**Escalate to Tech Lead if**:
- After Java upgrade still fails
- Need to debug source code issues
- Need to revert recent changes

**Escalation**:
1. Capture output: `./mvnw clean compile 2>&1 | tee /tmp/build-error.log`
2. Document: Java version, last git commits, error messages
3. Slack: @tech-lead "Maven build failing - [error type]"
4. SLA: 2 hours

---

# CONTINGENCY #8: Unit Tests Fail

## Detection

**Error Message**:
```
[ERROR] Tests run: 47, Failures: 3, Errors: 0, Skipped: 0
[ERROR] FAILURE: Tests run: 47, Failures: 3, Errors: 0
```

---

## Severity: LOW-MEDIUM
- **Impact**: Development quality concern, not blocking execution
- **Timeline Impact**: +30-60 minutes (if investigating)
- **Recovery SLA**: 4 hours (QA Lead)
- **Deferrable**: Can continue verification and fix tests on Day 1

---

## Quick Diagnosis (2 minutes)

```bash
# Test 1: Run tests
./mvnw test 2>&1 | tail -30

# Test 2: Count results
./mvnw test 2>&1 | grep "Tests run:"

# Test 3: See which tests failed
./mvnw test 2>&1 | grep -E "FAIL|ERROR" | head -10
```

---

## Root Causes

1. **Tests were already failing** (most common)
   - Known issues in CI/CD
   - Environmental differences
   - Fix time: Skip for now, investigate later

2. **Data not initialized** (occasional)
   - Test database not set up
   - Fixtures not loaded
   - Fix time: 10-15 minutes

3. **Recent code change broke tests** (occasional)
   - New feature introduced incompatibility
   - Test wasn't updated with code
   - Fix time: 20-30 minutes

---

## Action: Document and Continue

```bash
# Step 1: Capture full test output
./mvnw test 2>&1 | tee /tmp/test-results.txt

# Step 2: Extract failing tests
grep "FAIL\|ERROR" /tmp/test-results.txt > /tmp/failing-tests.txt

# Step 3: Check if these are known failures
# Look in: CI/CD logs, GitHub issues, JIRA tickets

# Step 4: Decision:
# - If known failures (>2 weeks old): Continue verification
# - If new failures (recent): Investigate or escalate

# Step 5: Document in daily report
# "Unit tests: X/Y pass (Z failures - documented in [JIRA ticket])"

# Step 6: Create GitHub issue if new failure
# Title: "Unit test failure: [test name]"
# Description: Test output, reproduction steps
# Label: sprint-19, testing

# Step 7: Continue with verification
# This is deferrable to Day 1 if needed
```

**Duration**: ~10 minutes to document

---

## When to Investigate Deeply

Only investigate if:
- Failures are new (appeared this week)
- Multiple tests failing (>3)
- Tests are in critical path (TransactionService, AurigraphResource)

```bash
# Deep investigation:

# Step 1: Run single failing test
./mvnw test -Dtest=FailingTestName 2>&1

# Step 2: See full error
./mvnw test -Dtest=FailingTestName -X 2>&1 | grep -A20 "FAIL\|ERROR"

# Step 3: Check test code
# Look in: src/test/java/io/aurigraph/v11/

# Step 4: See if database setup is the issue
# Check: TestContainers configuration, @BeforeEach setup

# Step 5: Run with debugging
./mvnw test -Dtest=FailingTestName -DargLine="-Xdebug"

# Step 6: Report findings
# Create GitHub issue with:
# - Full error output
# - Test code that's failing
# - Suspected root cause
# - Reproduction steps
```

**Duration**: ~30-60 minutes (if investigating)

---

## Escalation

**Only escalate if**:
- Critical path tests failing
- >5 tests failing
- Tests blocking other verification items

**QA Lead Escalation**:
1. Capture test output
2. Document which tests and why they matter
3. Slack: @qa-lead "Unit tests failing - investigation needed"
4. SLA: Same day (4 hours response)

---

# CONTINGENCY #9: Gatling Not Installed

## Detection

**Error Message**:
```
✗ FAIL - Gatling not installed
→ Install: brew install gatling (macOS) or apt-get install gatling (Linux)
```

---

## Severity: LOW
- **Impact**: Cannot run load tests
- **Timeline Impact**: +5 minutes
- **Recovery SLA**: Self-service (5 minutes)
- **Deferrable**: Can be done on Day 1

---

## Quick Fix (5 minutes)

```bash
# macOS
brew install gatling

# Or Linux
apt-get install gatling

# Verify
gatling.sh -version
# Or: gatling --version

# Expected: Gatling 3.9+ or similar
```

**Duration**: ~5 minutes (includes download)

---

## When Already Installed

```bash
# Check if it's in PATH
which gatling.sh
which gatling

# If not in PATH, it's installed but not available
find /usr/local -name gatling.sh 2>/dev/null
find /opt -name gatling.sh 2>/dev/null

# Add to PATH
export PATH="/usr/local/bin:$PATH"
export PATH="/opt/gatling/bin:$PATH"

# Verify
gatling.sh -version
```

---

# CONTINGENCY #10: Keycloak Unreachable

## Detection

**Error Message**:
```
✗ FAIL - HTTP 000 (connection refused)
curl: (7) Failed to connect to iam2.aurigraph.io port 443
```

---

## Severity: MEDIUM
- **Impact**: Cannot obtain JWT tokens, auth blocked
- **Timeline Impact**: +60+ minutes (if Keycloak down)
- **Recovery SLA**: 4 hours (Keycloak Admin)
- **Workaround**: Can skip if API already authenticated

---

## Quick Diagnosis (2 minutes)

```bash
# Test 1: Check if host is reachable
ping -c 3 iam2.aurigraph.io

# Test 2: Check DNS resolution
nslookup iam2.aurigraph.io
dig iam2.aurigraph.io

# Test 3: Check if service is up
curl -I https://iam2.aurigraph.io/auth
# Or: curl -I https://iam2.aurigraph.io

# Test 4: Check port
nc -zv iam2.aurigraph.io 443
```

---

## Root Causes

1. **Keycloak service down** (most common)
   - Process crashed
   - Out of memory
   - Disk full
   - Fix time: DevOps restart (~5-10 mins)

2. **Network connectivity** (occasional)
   - DNS failure
   - Firewall blocking
   - ISP issue
   - Fix time: 0 (wait for network)

3. **Certificate issue** (rare)
   - SSL cert expired
   - Certificate problem
   - Fix time: Cert renewal

---

## Quick Actions

```bash
# Step 1: Check if temporary
for i in {1..3}; do
  curl -s -I https://iam2.aurigraph.io/auth
  sleep 5
done
# If one succeeds: Temporary blip, continue

# Step 2: Check status page (if exists)
# curl https://status.aurigraph.io

# Step 3: Document in daily report
# "Keycloak temporarily unavailable (5:30-5:35 PM) - resolved automatically"

# Step 4: If persistent (>5 mins), escalate
```

**Duration**: ~2-3 minutes

---

## When to Escalate

**Escalate immediately if**:
- Keycloak down for >5 minutes
- Consistent 503 or timeout errors
- Multiple attempts all fail

**Escalation**:
1. Post in Slack: @keycloak-support "Keycloak down - cannot authenticate"
2. Email Keycloak Admin with:
   - Issue: Service unreachable
   - Time first detected
   - Attempts made
   - Impact: Blocking Sprint 19 verification
3. SLA: 1 hour first response (should be faster if critical)

---

# ESCALATION SUMMARY MATRIX

| Issue | First Action | Escalation Level 1 | Escalation Level 2 | Decision Point |
|-------|--------------|--------------------|--------------------|----------------|
| GitHub SSH | Fix locally (5m) | GitHub Admin (1h) | GitHub Support | After 15 min failed attempts |
| JIRA Token | Regenerate (5m) | JIRA Admin (2h) | Account Team | After 20 min failed attempts |
| V10 SSH | Load credentials (2m) | V10 DevOps (2h) | Network Team | After 15 min failed attempts |
| V10 API | Monitor (2m) | V10 Ops (4h) | Executive | After 5 min persistent down |
| Database | Start service (2m) | Database Admin (30m) | Infrastructure | After 10 min failed attempts |
| Quarkus | Update Java (10m) | Tech Lead (2h) | DevOps | After 20 min failed attempts |
| Maven | Clear cache (10m) | Tech Lead (2h) | DevOps | After 20 min failed attempts |
| Unit Tests | Document (10m) | QA Lead (4h) | Tech Lead | New failures only |
| Gatling | Install (5m) | N/A | N/A | Self-service, no escalation |
| Keycloak | Wait/monitor (2m) | Keycloak Admin (4h) | Network Team | After 5 min persistent |

---

## Decision Framework

**Immediate Action** (you can fix):
- Take quick fix action (5-10 mins)
- If successful: Document and continue
- If unsuccessful: Proceed to escalation

**Escalate if**:
- Quick fix takes >15 minutes
- Issue blocks critical path (GitHub, Database, Quarkus)
- Multiple items affected
- Time is running out

**Document Everything**:
- What you tried
- What error you got
- When you started
- Escalation time
- Who you contacted
- Result

---

**Document Version**: 1.0
**Created**: December 25, 2025
**Status**: ✅ Ready for production use
**Last Review**: December 25, 2025 at 10:00 AM EST
