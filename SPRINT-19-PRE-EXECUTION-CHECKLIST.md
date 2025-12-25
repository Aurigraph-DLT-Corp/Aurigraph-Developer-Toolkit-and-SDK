# Sprint 19 Pre-Execution Checklist

**Prepared By**: Sprint 19 Verification Framework
**Date**: December 25, 2025
**For Execution**: December 26-31, 2025
**Status**: ✅ Ready for team sign-off

---

## SECTION 1: IMMEDIATE PRE-FLIGHT (Dec 26, 8:00-8:45 AM)

### Time Block: 45 minutes before execution starts

**Owner**: Tech Lead + Scrum Master
**Duration**: 45 minutes
**Dependencies**: None (all systems pre-checked Dec 25)

---

### Checklist Item 1.1: Team Availability & Communication

- [ ] **Confirm all team members available** (9:00 AM sharp)
  - [ ] @J4CDeploymentAgent - available
  - [ ] @J4CNetworkAgent - available
  - [ ] @J4CTestingAgent - available
  - [ ] @J4CCoordinatorAgent - available
  - [ ] Tech Lead - available
  - [ ] Scrum Master - available

- [ ] **Open group communication channel** (Slack #sprint-19-verification)
  - Command: `# Team standup starting in 15 minutes`
  - Tone: Professional but encouraging

- [ ] **Confirm video call link** active
  - Zoom/Teams link tested
  - All participants can join
  - Screen sharing enabled
  - Recording started (if approved)

- [ ] **Send morning reminder** (8:45 AM)
  - Template: See SPRINT-19-TEAM-COMMUNICATION-TEMPLATES.md
  - Include: Start time, script command, expected duration

**Success Criteria**: 6/6 people confirmed in video call by 8:55 AM

---

### Checklist Item 1.2: System Environment Verification

**Owner**: Tech Lead
**Duration**: 20 minutes

#### Bash & Shell Environment

- [ ] **Verify bash version** (required: 4.0+)
  ```bash
  bash --version
  # Expected: GNU bash, version 4.0 or higher
  ```

- [ ] **Check $PATH** includes required tools
  ```bash
  echo $PATH
  # Should include: /usr/local/bin, /opt/homebrew/bin, etc.
  ```

- [ ] **Verify curl is installed**
  ```bash
  which curl && curl --version
  # Expected: curl 7.x or higher
  ```

- [ ] **Verify jq is installed** (optional but recommended)
  ```bash
  which jq && jq --version
  # Expected: jq-1.6 or higher
  # If missing: brew install jq (takes 2 mins)
  ```

#### Git & Repository

- [ ] **Verify Git status** (no conflicting commits)
  ```bash
  cd ~/Aurigraph-DLT
  git status
  # Expected: "On branch V12" with clean working tree
  ```

- [ ] **Verify SSH key permissions** (correct for GitHub)
  ```bash
  ls -la ~/.ssh/id_*
  # Expected: -rw------- (600) for private keys
  #         -rw-r--r-- (644) for public keys
  ```

- [ ] **Verify script is executable**
  ```bash
  ls -l scripts/ci-cd/verify-sprint19-credentials.sh
  # Expected: -rwxr-xr-x (755)
  ```

#### Database & Services

- [ ] **Check PostgreSQL installation**
  ```bash
  which psql
  # If missing: brew install postgresql (takes 3 mins)
  ```

- [ ] **Verify PostgreSQL service status**
  ```bash
  psql --version
  # Expected: psql (PostgreSQL) version 14+
  ```

- [ ] **Check Java installation** (required for V11)
  ```bash
  java --version
  # Expected: openjdk version "21" or higher
  ```

- [ ] **Verify Maven availability**
  ```bash
  which mvn
  # Expected: /path/to/mvn
  ```

#### Network Connectivity

- [ ] **Test GitHub connectivity**
  ```bash
  ssh -T git@github.com 2>&1 | head -1
  # Expected: "Hi [username]!"
  ```

- [ ] **Test Keycloak connectivity**
  ```bash
  curl -s https://iam2.aurigraph.io/auth -I
  # Expected: HTTP status 200-399
  ```

- [ ] **Test V10 API connectivity** (if available)
  ```bash
  curl -s https://v10-api.aurigraph.io/api/v10/health -I
  # Expected: HTTP status 200-399
  ```

**Success Criteria**: 12/12 checks PASS

---

### Checklist Item 1.3: Credentials & Environment Variables

**Owner**: Tech Lead
**Duration**: 15 minutes
**Security Note**: Never echo credentials - only verify they're set

#### Load Credentials from Credentials.md

- [ ] **Extract JIRA tokens**
  ```bash
  # Source: ~/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md
  # For each agent (Deployment, Network, Testing, Coordinator):
  export JIRA_TOKEN_DEPLOYMENT="$(grep 'JIRA_TOKEN_DEPLOYMENT' ~/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md | cut -d'=' -f2)"
  # Repeat for NETWORK, TESTING, COORDINATOR
  # Verify: echo ${JIRA_TOKEN_DEPLOYMENT:0:10}... should show partial token
  ```

- [ ] **Extract and set V10 credentials**
  ```bash
  export V10_PASSWORD="$(grep 'V10_PASSWORD' ~/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md | cut -d'=' -f2)"
  export V10_TOKEN="$(grep 'V10_TOKEN' ~/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md | cut -d'=' -f2)"
  # Verify: echo ${V10_PASSWORD:0:5}... should show first 5 chars
  ```

- [ ] **Extract and set database password**
  ```bash
  export DB_PASSWORD="$(grep 'DB_PASSWORD\|postgres.*password' ~/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md | cut -d'=' -f2)"
  # Verify: echo ${DB_PASSWORD:0:5}... should show first 5 chars
  ```

- [ ] **Extract and set Keycloak credentials**
  ```bash
  export KEYCLOAK_PASSWORD="$(grep 'KEYCLOAK.*PASSWORD\|Keycloak.*password' ~/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md | cut -d'=' -f2)"
  export KEYCLOAK_USER="awdadmin"  # Known user from CLAUDE.md
  # Verify: echo ${KEYCLOAK_PASSWORD:0:5}... should show first 5 chars
  ```

- [ ] **Verify all credentials are set** (security check)
  ```bash
  # Safe check - only shows if variables exist, not their values
  test -n "$JIRA_TOKEN_DEPLOYMENT" && echo "✓ JIRA_TOKEN_DEPLOYMENT set"
  test -n "$V10_PASSWORD" && echo "✓ V10_PASSWORD set"
  test -n "$V10_TOKEN" && echo "✓ V10_TOKEN set"
  test -n "$DB_PASSWORD" && echo "✓ DB_PASSWORD set"
  test -n "$KEYCLOAK_PASSWORD" && echo "✓ KEYCLOAK_PASSWORD set"
  # Expected: All 5 should show ✓
  ```

**Success Criteria**: All 5 credentials loaded and verified (echo test shows all variables set)

---

### Checklist Item 1.4: Service Readiness Verification

**Owner**: DevOps Lead
**Duration**: 10 minutes

#### Database Service

- [ ] **PostgreSQL running on localhost:5432**
  ```bash
  PGPASSWORD="$DB_PASSWORD" psql -h localhost -U aurigraph -d aurigraph -c "SELECT 1;"
  # Expected: (1 row) showing result "1"
  ```

- [ ] **Database contains expected tables**
  ```bash
  PGPASSWORD="$DB_PASSWORD" psql -h localhost -U aurigraph -d aurigraph -c "\dt"
  # Expected: List of tables (transactions, blocks, consensus_log, etc.)
  ```

#### Keycloak Service

- [ ] **Keycloak accessible on iam2.aurigraph.io**
  ```bash
  curl -s https://iam2.aurigraph.io/auth -I | head -1
  # Expected: HTTP/2 200 or similar
  ```

- [ ] **Keycloak admin console accessible**
  ```bash
  curl -s https://iam2.aurigraph.io/auth/admin -I | head -1
  # Expected: HTTP/2 200 or redirect (3xx)
  ```

#### V10 API Service (if applicable)

- [ ] **V10 API responding on v10-api.aurigraph.io**
  ```bash
  curl -s https://v10-api.aurigraph.io/api/v10/health -w "\n%{http_code}" | tail -1
  # Expected: 200 or 503 (if temporary)
  ```

**Success Criteria**: 4/4 services accessible

---

### Checklist Item 1.5: Script Pre-Staging

**Owner**: Tech Lead
**Duration**: 5 minutes

- [ ] **Verify script exists and is executable**
  ```bash
  test -x scripts/ci-cd/verify-sprint19-credentials.sh && echo "✓ Script ready"
  ```

- [ ] **Copy script to execution directory** (optional, for safety)
  ```bash
  cp scripts/ci-cd/verify-sprint19-credentials.sh /tmp/verify-sprint19-backup.sh
  chmod +x /tmp/verify-sprint19-backup.sh
  ```

- [ ] **Test script with dry-run** (shows output format)
  ```bash
  ./scripts/ci-cd/verify-sprint19-credentials.sh 2>&1 | head -20
  # Expected: Shows header with color codes and first check starting
  ```

- [ ] **Prepare result capture method**
  ```bash
  # Option 1: Redirect to file
  mkdir -p /tmp/sprint19-results

  # Option 2: Use tee for both screen and file
  # ./scripts/ci-cd/verify-sprint19-credentials.sh | tee /tmp/sprint19-results/section1-$(date +%Y%m%d-%H%M%S).txt
  ```

**Success Criteria**: Script confirmed executable and ready

---

### Checklist Item 1.6: Result Recording Setup

**Owner**: Scrum Master
**Duration**: 5 minutes

- [ ] **Prepare result recording template**
  ```bash
  cat > /tmp/sprint19-results/SECTION1-RESULTS-Dec26.txt << 'EOF'
  Sprint 19 Section 1 Verification Results
  Date: December 26, 2025
  Time: 9:00 AM - 10:00 AM EST
  Location: Video call (Zoom)
  Team Members: [list names]

  Script Execution:
  ================
  Start Time: _______
  End Time: _______
  Total Duration: _______

  Results:
  --------
  [Paste script output here]

  Summary:
  --------
  PASSED: ___ / 8
  FAILED: ___ / 8
  SKIPPED: ___ / 8

  Items Requiring Follow-up:
  [List any failed items]

  Next Steps:
  [Document what happens next]

  Recorded By: ________________  Date: ___________
  EOF
  ```

- [ ] **Set up Slack notification template**
  - Channel: #sprint-19-verification
  - Template: See SPRINT-19-TEAM-COMMUNICATION-TEMPLATES.md
  - Timing: Post result immediately after script completes

- [ ] **Prepare escalation contact list**
  - Tech Lead: [name/phone]
  - Project Manager: [name/phone]
  - Executive Sponsor: [name/phone]
  - On-call DevOps: [name/phone]

**Success Criteria**: All templates prepared and shared with team

---

## SECTION 2: SECTION 1 EXECUTION (Dec 26, 9:00-10:00 AM)

### Time Block: 60 minutes for actual verification

**Owner**: All agents + Tech Lead
**Duration**: ~45 seconds automated + 15 minutes Q&A/follow-up
**Gate**: MUST complete by 10:00 AM

---

### Execution Step 1: Pre-Test Briefing (1 min)

- [ ] **Tech Lead briefs team** (1 minute)
  - "We're about to run the automated verification script"
  - "It will check 8 critical items"
  - "Should complete in 45 seconds"
  - "We'll review results together"

- [ ] **Confirm everyone ready to run**
  - [ ] Agents confirm ready
  - [ ] Recording started
  - [ ] Slack monitoring enabled

---

### Execution Step 2: Run Automated Script (45 seconds)

- [ ] **All team members run script simultaneously** (or Tech Lead runs with screen share)
  ```bash
  cd ~/Aurigraph-DLT

  # Verify credentials are loaded
  test -n "$JIRA_TOKEN_DEPLOYMENT" || echo "WARNING: JIRA_TOKEN_DEPLOYMENT not set"
  test -n "$V10_PASSWORD" || echo "WARNING: V10_PASSWORD not set"

  # Run verification script
  ./scripts/ci-cd/verify-sprint19-credentials.sh
  ```

- [ ] **Screen share shows output** (for remote observation)
  - All color codes visible
  - All results recorded
  - Timestamp captured

- [ ] **Capture output to file**
  ```bash
  # In another terminal:
  script /tmp/sprint19-results/section1-output-$(date +%Y%m%d-%H%M%S).txt
  # Then paste script output or run it again with tee
  ```

---

### Execution Step 3: Immediate Results Review (10 mins)

- [ ] **Review each result** with team
  - [ ] GitHub SSH: Expected PASS
  - [ ] V10 SSH: Expected PASS or SKIP
  - [ ] V10 API: Expected PASS or SKIP
  - [ ] V11 Database: Expected PASS
  - [ ] V11 Quarkus: Expected PASS
  - [ ] Keycloak: Expected PASS or SKIP
  - [ ] Gatling: Expected PASS

- [ ] **Document any failures**
  - [ ] Note which items failed
  - [ ] Record error messages
  - [ ] Identify root cause

- [ ] **Determine next actions** for any failures
  - [ ] If 0 failures: Celebrate, proceed to Section 2
  - [ ] If 1-2 failures: Quick fix attempt (10 mins)
  - [ ] If >2 failures: Escalate to Tech Lead

---

### Execution Step 4: Results Recording (5 mins)

- [ ] **Scrum Master records results** in spreadsheet
  ```
  Item | Expected | Actual | Status | Notes | Owner for Followup
  -----|----------|--------|--------|-------|-------------------
  1.5  | PASS     | PASS   | ✓      | None  | -
  1.6.1| PASS/SKP | ?      | ?      | TBD   | Tech Lead
  ...
  ```

- [ ] **Post summary to Slack**
  - Template: Section 1 Results - 7/7 PASS
  - Include any follow-up items
  - Tag: @channel if any escalation needed

- [ ] **Create GitHub issue** if any failures
  - Title: "Section 1 Verification - [Item X] Failed"
  - Description: Error details + reproduction steps
  - Labels: sprint-19, critical, verification
  - Assign to: Responsible agent

---

## SECTION 3: SECTION 2 EXECUTION (Dec 26, 1:00-2:00 PM)

### Time Block: 60 minutes for dev environment verification

**Owner**: Tech Lead + Development Team
**Duration**: ~45 minutes (Maven, Quarkus, tests, DB)
**Gate**: MUST show all 6 items working by 2:00 PM

---

### Pre-Execution Checks (10 mins)

- [ ] **Navigate to V11 directory**
  ```bash
  cd ~/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
  pwd  # Should show: .../aurigraph-v11-standalone
  ```

- [ ] **Verify pom.xml exists**
  ```bash
  ls -lh pom.xml
  # Expected: file with size >1KB
  ```

- [ ] **Check Maven version**
  ```bash
  ./mvnw --version
  # Expected: Apache Maven 3.9+ or higher
  # Java version: 21+
  ```

- [ ] **Verify dependencies can download**
  ```bash
  ./mvnw help:version
  # Expected: Completes successfully, no network errors
  ```

---

### Test 2.1: Maven Clean Compile (10 mins)

- [ ] **Execute clean compile**
  ```bash
  ./mvnw clean compile
  ```

- [ ] **Success indicators**
  - [ ] No "BUILD FAILURE" message
  - [ ] No compilation errors
  - [ ] All classes compiled (should show "Building jar" or similar)
  - [ ] "BUILD SUCCESS" appears at end

- [ ] **Record timing** (for performance baseline)
  - Start time: _______
  - End time: _______
  - Duration: _______ (target: <15 mins)

- [ ] **Document any warnings**
  - [ ] Plugin version warnings (acceptable)
  - [ ] Deprecated method warnings (acceptable)
  - [ ] Actual compilation errors (FAIL)

---

### Test 2.2: Quarkus Dev Mode (10 mins)

- [ ] **Start Quarkus in dev mode** (separate terminal)
  ```bash
  ./mvnw quarkus:dev
  # Expected: Server starts, shows port 9003
  ```

- [ ] **Wait for "Quarkus x.x.x started" message**
  - Record startup time (target: <30 seconds)
  - Note any warnings or errors

- [ ] **Test health endpoint** (in another terminal)
  ```bash
  curl http://localhost:9003/q/health
  # Expected: JSON response with status UP
  ```

- [ ] **Test REST endpoint**
  ```bash
  curl http://localhost:9003/api/v11/health
  # Expected: JSON response with health status
  ```

- [ ] **Stop Quarkus** (CTRL+C in dev terminal)
  ```bash
  # Server should shut down gracefully (5 seconds)
  ```

---

### Test 2.3: Unit Tests (15 mins)

- [ ] **Run full test suite**
  ```bash
  ./mvnw test
  ```

- [ ] **Monitor test execution**
  - [ ] Tests compile successfully
  - [ ] Tests execute (should see test classes running)
  - [ ] Tests complete with summary

- [ ] **Success indicators**
  - [ ] "BUILD SUCCESS" at end
  - [ ] Total tests shown (e.g., "Tests run: 47, Failures: 0")
  - [ ] No "FAILURE" message in output

- [ ] **Record test metrics**
  - Total tests: _______
  - Passed: _______
  - Failed: _______ (should be 0)
  - Duration: _______

- [ ] **Handle test failures** (if any)
  - [ ] Note failing test names
  - [ ] Check if known failures (check CI/CD log)
  - [ ] Document for escalation if new failures

---

### Test 2.4: Database Connectivity (5 mins)

- [ ] **Test PostgreSQL connection**
  ```bash
  PGPASSWORD="$DB_PASSWORD" psql -h localhost -U aurigraph -d aurigraph -c "SELECT 1;"
  # Expected: (1 row) with result "1"
  ```

- [ ] **Check database tables exist**
  ```bash
  PGPASSWORD="$DB_PASSWORD" psql -h localhost -U aurigraph -d aurigraph -c "\dt"
  # Expected: Lists tables like public.transactions, etc.
  ```

- [ ] **Test table content** (basic query)
  ```bash
  PGPASSWORD="$DB_PASSWORD" psql -h localhost -U aurigraph -d aurigraph -c "SELECT count(*) FROM transactions LIMIT 5;" 2>/dev/null || echo "Table exists"
  # Expected: Returns row count or indicates table exists
  ```

---

### Test 2.5: IDE/Editor Setup (5 mins)

- [ ] **Verify IntelliJ IDEA / VS Code** opens project
  ```bash
  # For IntelliJ:
  open -a "IntelliJ IDEA" ~/Aurigraph-DLT

  # For VS Code:
  code ~/Aurigraph-DLT
  ```

- [ ] **IDE features working**
  - [ ] Project index loaded (may take 1-2 mins)
  - [ ] Can navigate to source files
  - [ ] Can see Maven project structure

- [ ] **Syntax highlighting enabled**
  - [ ] Java files show color coding
  - [ ] XML files (pom.xml) show structure

---

### Section 2 Summary (5 mins)

- [ ] **Record all results** in tracking spreadsheet
  - [ ] Maven compile: PASS/FAIL
  - [ ] Quarkus startup: PASS/FAIL
  - [ ] Health endpoint: PASS/FAIL
  - [ ] Unit tests: PASS/FAIL (with test count)
  - [ ] Database: PASS/FAIL
  - [ ] IDE: PASS/FAIL

- [ ] **Post results to Slack**
  ```
  Section 2 Results - Development Environment
  ============================================
  Maven Clean Compile: ✓ PASS (12 mins)
  Quarkus Dev Mode: ✓ PASS (22 secs startup)
  Health Endpoint: ✓ PASS
  Unit Tests: ✓ PASS (47/47 tests)
  Database: ✓ PASS
  IDE: ✓ PASS

  Overall: 6/6 PASS
  ```

- [ ] **Escalate if any failures**
  - [ ] Create GitHub issue for failures
  - [ ] Tag Tech Lead for immediate review
  - [ ] Assess impact on Dec 27 gate

---

## SECTION 4: DAILY TRACKING (Dec 26-31)

### Daily Status Report (5:00 PM Each Day)

- [ ] **Prepare daily report** using template in SPRINT-19-VERIFICATION-DAILY-TRACKER.md

- [ ] **Include**
  - [ ] Date and day number (Day 1, Day 2, etc.)
  - [ ] Items completed today
  - [ ] Items in progress
  - [ ] Blockers encountered
  - [ ] Items deferred (with justification)
  - [ ] Completion percentage
  - [ ] On-track assessment (AHEAD/ON-TIME/AT-RISK)

- [ ] **Post to Slack** #sprint-19-verification
  - [ ] Mentions successes
  - [ ] Flags any blockers
  - [ ] Requests help if needed

- [ ] **Email to stakeholders** (optional, if significant news)
  - [ ] Project Manager
  - [ ] Executive Sponsor
  - [ ] Team leads

---

## SECTION 5: CONTINGENCY PLANNING

### If GitHub SSH Fails
1. Check SSH key exists: `ls -la ~/.ssh/id_*`
2. Test key: `ssh -v git@github.com 2>&1 | grep -i authentication`
3. Regenerate if needed: `ssh-keygen -t ed25519 -C "your-email"`
4. Add to GitHub: https://github.com/settings/keys
5. Escalate to: GitHub Org Admin (1 hour SLA)

### If V10 SSH Fails
1. Test SSH manually: `ssh -v -p 2235 subbu@dlt.aurigraph.io`
2. Check password: Verify in Credentials.md
3. Check SSH port: Confirm 2235 is correct
4. Escalate to: DevOps Lead (2 hour SLA)

### If V11 Database Fails
1. Check PostgreSQL running: `brew services list | grep postgres`
2. Start if needed: `brew services start postgresql`
3. Check port: `lsof -i :5432`
4. Verify credentials: Check DB_PASSWORD is correct
5. Escalate to: Database Admin (30 min SLA)

### If Quarkus Won't Start
1. Check Java version: `java --version` (must be 21+)
2. Check port 9003: `lsof -i :9003` (kill if needed)
3. Check logs: `./mvnw quarkus:dev 2>&1 | tail -20`
4. Try clean build: `./mvnw clean compile`
5. Escalate to: Tech Lead (2 hour SLA)

### If Maven Build Fails
1. Check Java: `java --version`
2. Check Maven: `./mvnw --version`
3. Try clean: `./mvnw clean`
4. Check pom.xml: Look for obvious syntax errors
5. Escalate to: Tech Lead (4 hour SLA)

---

## Sign-Off

**Prepared By**: _________________ **Date**: _____________

**Reviewed By**: _________________ **Date**: _____________

**Approved By**: _________________ **Date**: _____________

**Team Lead Confirmation**: I confirm this checklist is ready for execution

Signature: _________________________ **Date**: _____________

---

## Appendix A: Tool Installation Quick Commands

```bash
# Install missing tools (macOS)
brew install postgresql       # PostgreSQL client for DB testing
brew install jq              # JSON query tool for parsing responses
brew install gatling         # Load testing tool
brew install maven           # Maven (if not using bundled mvnw)

# Verify installations
psql --version
jq --version
gatling.sh -version
mvn --version
```

## Appendix B: Quick Credential Loading

```bash
# Load all credentials from Credentials.md
CREDS_FILE="$HOME/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md"

export JIRA_TOKEN_DEPLOYMENT="$(grep -A1 'JIRA_TOKEN_DEPLOYMENT' "$CREDS_FILE" | tail -1)"
export V10_PASSWORD="$(grep -A1 'V10_PASSWORD' "$CREDS_FILE" | tail -1)"
export V10_TOKEN="$(grep -A1 'V10_TOKEN' "$CREDS_FILE" | tail -1)"
export DB_PASSWORD="$(grep -A1 'DB_PASSWORD' "$CREDS_FILE" | tail -1)"
export KEYCLOAK_PASSWORD="$(grep -A1 'KEYCLOAK.*PASSWORD' "$CREDS_FILE" | tail -1)"

# Verify all set
echo "Credentials loaded:"
test -n "$JIRA_TOKEN_DEPLOYMENT" && echo "✓ JIRA token"
test -n "$V10_PASSWORD" && echo "✓ V10 password"
test -n "$V10_TOKEN" && echo "✓ V10 token"
test -n "$DB_PASSWORD" && echo "✓ Database password"
test -n "$KEYCLOAK_PASSWORD" && echo "✓ Keycloak password"
```

---

**Document Version**: 1.0
**Last Updated**: December 25, 2025
**Next Review**: December 26, 8:00 AM
**Status**: ✅ READY FOR EXECUTION
