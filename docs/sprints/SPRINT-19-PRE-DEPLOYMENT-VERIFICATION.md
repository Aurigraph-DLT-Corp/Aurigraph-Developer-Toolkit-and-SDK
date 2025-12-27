# Sprint 19 Pre-Deployment Verification Guide

**Document Type**: Interactive Verification Tracker
**Current Phase**: Section 1 - Credentials & Access
**Target Date**: December 31, 2025
**Readiness Threshold**: ≥95% of 37 items completed

---

## 🎯 Quick Start: Verification Commands

Run these commands sequentially to verify each credential. Copy-paste the command, replace placeholders in brackets, and record the result.

---

## ✅ SECTION 1: CREDENTIALS & ACCESS VERIFICATION
### Status: 🔴 NOT STARTED
### Due: December 27, 2025
### Risk Level: 🔴 CRITICAL (Blockers if incomplete)

---

### Item 1.1: JIRA API Token - @J4CDeploymentAgent

**What to verify**: Agent can authenticate to JIRA and access AV12 project

**Verification Command**:
```bash
# Replace with actual values
export AGENT_EMAIL="deployment-agent@aurigraph.io"
export JIRA_TOKEN="your-api-token-here"
export JIRA_URL="https://aurigraphdlt.atlassian.net"

# Test JIRA API access
curl -s -u "${AGENT_EMAIL}:${JIRA_TOKEN}" \
  "${JIRA_URL}/rest/api/3/myself" | jq '.'

# Expected output:
# {
#   "accountId": "6234567890abcdef",
#   "emailAddress": "deployment-agent@aurigraph.io",
#   "displayName": "Deployment Agent"
# }
```

**Result**:
- [ ] ✅ PASS - accountId returned, authentication successful
- [ ] ❌ FAIL - 401 Unauthorized (token invalid)
- [ ] ❌ FAIL - 403 Forbidden (no project access)
- [ ] ⏳ NOT TESTED - token not yet available

**Notes**: ___________________________

**Reference**: From `/Users/subbujois/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md` (JIRA section)

---

### Item 1.2: JIRA API Token - @J4CNetworkAgent

**Verification Command**:
```bash
export AGENT_EMAIL="network-agent@aurigraph.io"
export JIRA_TOKEN="your-api-token-here"

curl -s -u "${AGENT_EMAIL}:${JIRA_TOKEN}" \
  "https://aurigraphdlt.atlassian.net/rest/api/3/myself" | jq '.accountId'
```

**Result**:
- [ ] ✅ PASS
- [ ] ❌ FAIL
- [ ] ⏳ NOT TESTED

**Notes**: ___________________________

---

### Item 1.3: JIRA API Token - @J4CTestingAgent

**Verification Command**:
```bash
export AGENT_EMAIL="testing-agent@aurigraph.io"
export JIRA_TOKEN="your-api-token-here"

curl -s -u "${AGENT_EMAIL}:${JIRA_TOKEN}" \
  "https://aurigraphdlt.atlassian.net/rest/api/3/myself" | jq '.accountId'
```

**Result**:
- [ ] ✅ PASS
- [ ] ❌ FAIL
- [ ] ⏳ NOT TESTED

**Notes**: ___________________________

---

### Item 1.4: JIRA API Token - @J4CCoordinatorAgent

**Verification Command**:
```bash
export AGENT_EMAIL="coordinator-agent@aurigraph.io"
export JIRA_TOKEN="your-api-token-here"

curl -s -u "${AGENT_EMAIL}:${JIRA_TOKEN}" \
  "https://aurigraphdlt.atlassian.net/rest/api/3/myself" | jq '.accountId'
```

**Result**:
- [ ] ✅ PASS
- [ ] ❌ FAIL
- [ ] ⏳ NOT TESTED

**Notes**: ___________________________

---

### Item 1.5: GitHub SSH Access - All 4 Agents

**What to verify**: All agents can clone and push to Aurigraph-DLT-Corp/Aurigraph-DLT

**Verification Command** (run on each agent's machine):
```bash
# Test SSH key is registered
ssh -T git@github.com

# Expected output:
# Hi [agent-name]! You've successfully authenticated, but GitHub does not provide shell access.

# Test clone without password prompt
git clone git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git /tmp/test-clone
# Should complete without asking for password

# Test push capability
cd /tmp/test-clone
git config user.email "agent@aurigraph.io"
git config user.name "Agent Name"
git checkout -b test-branch
echo "test" > test.txt
git add test.txt
git commit -m "test push"
# Don't actually push to main, but this tests capability

# Cleanup
rm -rf /tmp/test-clone
```

**Result for @J4CDeploymentAgent**:
- [ ] ✅ PASS - SSH auth successful, can clone
- [ ] ❌ FAIL - SSH key not registered
- [ ] ❌ FAIL - Authentication failed
- [ ] ⏳ NOT TESTED

**Result for @J4CNetworkAgent**:
- [ ] ✅ PASS
- [ ] ❌ FAIL
- [ ] ⏳ NOT TESTED

**Result for @J4CTestingAgent**:
- [ ] ✅ PASS
- [ ] ❌ FAIL
- [ ] ⏳ NOT TESTED

**Result for @J4CCoordinatorAgent**:
- [ ] ✅ PASS
- [ ] ❌ FAIL
- [ ] ⏳ NOT TESTED

**Notes**: ___________________________

**Reference**: GitHub SSH setup docs: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

---

### Item 1.6: V10 & V12 Service Credentials

**What to verify**:
1. Can SSH into V10 production server
2. Can authenticate to V10 REST API
3. Can connect to V12 database
4. Can reach V12 Quarkus service

**Verification Command - V10 SSH**:
```bash
# From Credentials.md: V10 production host, port, user
export V10_HOST="dlt.aurigraph.io"
export V10_USER="subbu"
export V10_PORT="2235"
export V10_PASSWORD="your-password-here"

# Test SSH connection (non-interactive using sshpass)
sshpass -p "${V10_PASSWORD}" ssh -p ${V10_PORT} ${V10_USER}@${V10_HOST} "echo 'SSH successful'"

# Expected: "SSH successful" printed
```

**Verification Command - V10 REST API**:
```bash
export V10_API="https://v10-api.aurigraph.io/api/v10"
export V10_TOKEN="your-bearer-token-here"

# Test V10 health check
curl -s -H "Authorization: Bearer ${V10_TOKEN}" \
  "${V10_API}/health" | jq '.status'

# Expected: "UP" (or similar healthy status)
```

**Verification Command - V12 Database**:
```bash
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_USER="aurigraph"
export DB_PASSWORD="your-db-password-here"
export DB_NAME="aurigraph"

# Test database connection
PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} \
  -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1 as connection_test;"

# Expected:
#  connection_test
# ────────────────
#              1
# (1 row)
```

**Verification Command - V12 Quarkus Service**:
```bash
# Test V12 health endpoint (dev mode)
curl -s http://localhost:9003/q/health | jq '.status'

# Expected: "UP"
```

**Result - V10 SSH**:
- [ ] ✅ PASS
- [ ] ❌ FAIL - Connection refused
- [ ] ❌ FAIL - Authentication failed
- [ ] ⏳ NOT TESTED

**Result - V10 REST API**:
- [ ] ✅ PASS
- [ ] ❌ FAIL - 401 Unauthorized
- [ ] ❌ FAIL - 503 Service Unavailable
- [ ] ⏳ NOT TESTED

**Result - V12 Database**:
- [ ] ✅ PASS - Connected successfully
- [ ] ❌ FAIL - Connection refused
- [ ] ❌ FAIL - Authentication failed
- [ ] ⏳ NOT TESTED

**Result - V12 Quarkus**:
- [ ] ✅ PASS - Service responding
- [ ] ❌ FAIL - Connection refused
- [ ] ❌ FAIL - Service down
- [ ] ⏳ NOT TESTED

**Notes**: ___________________________

**Reference**: From Credentials.md V10 section, V12 database config

---

### Item 1.7: Keycloak/IAM Credentials

**What to verify**: Can authenticate to Keycloak and obtain JWT token

**Verification Command**:
```bash
export KEYCLOAK_URL="https://iam2.aurigraph.io"
export REALM="AWD"
export CLIENT_ID="test-client"
export USERNAME="test-user"
export PASSWORD="test-password"

# Obtain JWT token
RESPONSE=$(curl -s -X POST \
  "${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=${CLIENT_ID}" \
  -d "username=${USERNAME}" \
  -d "password=${PASSWORD}" \
  -d "grant_type=password")

echo "$RESPONSE" | jq '.access_token' | head -c 50

# Expected output: JWT token starting with "eyJ..." (first 50 chars shown)
# Full response should include:
# {
#   "access_token": "eyJ...",
#   "expires_in": 3600,
#   "token_type": "Bearer"
# }
```

**Result**:
- [ ] ✅ PASS - Token obtained successfully
- [ ] ❌ FAIL - 401 Unauthorized (credentials wrong)
- [ ] ❌ FAIL - 403 Forbidden (account locked)
- [ ] ❌ FAIL - Connection refused (Keycloak down)
- [ ] ⏳ NOT TESTED

**Notes**: ___________________________

**Reference**: From Credentials.md IAM section

---

### Item 1.8: Load Testing Tool (Gatling/JMeter)

**What to verify**: Gatling or JMeter installed and can target V12 gateway

**Verification Command**:
```bash
# Check Gatling installation
gatling.sh -version
# or
gatling --version

# Expected output: "Gatling version X.XX.X"

# If not installed:
# Download from: https://gatling.io/open-source/
# Or install via: brew install gatling (on macOS)
# Or: apt-get install gatling (on Linux)

# Test connection to V12 (ensure V12 is running on port 9003)
curl -s http://localhost:9003/q/health | jq '.status'
# Should return: "UP"
```

**Result**:
- [ ] ✅ PASS - Gatling installed, version X.XX.X
- [ ] ❌ FAIL - Gatling not found on PATH
- [ ] ❌ FAIL - Old version (need 3.9+)
- [ ] ⏳ NOT TESTED

**Notes**: ___________________________

---

## 📊 SECTION 1 SUMMARY

| Item | Verification | Pass/Fail | Date | Notes |
|------|--------------|-----------|------|-------|
| 1.1 | JIRA @DeploymentAgent | ☐ | | |
| 1.2 | JIRA @NetworkAgent | ☐ | | |
| 1.3 | JIRA @TestingAgent | ☐ | | |
| 1.4 | JIRA @CoordinatorAgent | ☐ | | |
| 1.5 | GitHub SSH - All agents | ☐ | | |
| 1.6 | V10/V12 Service credentials | ☐ | | |
| 1.7 | Keycloak/IAM JWT token | ☐ | | |
| **SECTION 1 TOTAL** | **7 items** | **0/7** | | |

---

## 🔍 If Verification Fails

### JIRA Token Issues
```bash
# Regenerate token at:
# https://id.atlassian.com/manage-profile/security/api-tokens
# 1. Click "Create API token"
# 2. Copy the token
# 3. Update your environment variable
```

### GitHub SSH Issues
```bash
# Check if SSH key exists
ls ~/.ssh/id_rsa
# or
ls ~/.ssh/id_ed25519

# If not, generate new key:
ssh-keygen -t ed25519 -C "agent@aurigraph.io"

# Add to GitHub:
# https://github.com/settings/keys
```

### Keycloak JWT Issues
```bash
# Verify test user exists in Keycloak
# https://iam2.aurigraph.io/admin
# Navigate: Realms → AWD → Users
# Create user if missing with password set

# Verify client exists
# https://iam2.aurigraph.io/admin
# Navigate: Realms → AWD → Clients
# Create "test-client" if missing with direct access grant enabled
```

### V10 API Issues
```bash
# Check if V10 service is running
curl -s https://v10-api.aurigraph.io/api/v10/health

# If 503 or connection refused:
# - Check if service needs restart
# - Check firewall rules
# - Verify token not expired
```

### V12 Database Issues
```bash
# Verify PostgreSQL is running
psql --version
# Should show: psql (PostgreSQL) X.X

# Verify database exists
PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -l | grep aurigraph

# If database doesn't exist, create it:
PGPASSWORD="${DB_PASSWORD}" createdb -h ${DB_HOST} -U ${DB_USER} aurigraph
```

### Gatling Installation
```bash
# macOS
brew install gatling
brew services start gatling

# Linux (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install gatling

# Verify installation
gatling --version
```

---

## 📅 Next Steps

**Once Section 1 is 100% complete**:
1. Update the status checkboxes above (mark each ☑️)
2. Record completion date
3. Proceed to **SECTION 2: Development Environment** (due Dec 27)
4. Document any issues encountered

**If any item blocks verification**:
1. Escalate to Tech Lead with full error message
2. Add note to "Notes" field above
3. Don't proceed to Section 2 until Section 1 is complete

---

**Generated**: December 25, 2025
**For**: Aurigraph V12 Migration - Sprint 19 Pre-Deployment
**Status**: Ready for verification

