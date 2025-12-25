# Sprint 19 Pre-Deployment Checklist
## Infrastructure & Readiness Verification

**Date**: December 25, 2025  
**Status**: 🟢 Ready for Verification  
**Target Completion**: December 31, 2025 (6 days before Sprint 19 start)  
**Responsibility**: Project Manager + Tech Lead  

---

## ✅ Section 1: Agent Credentials & Access (Complete by Dec 27)

### JIRA Access
- [ ] @J4CDeploymentAgent: JIRA API token configured for AV11 project
- [ ] @J4CNetworkAgent: JIRA API token configured for AV11 project
- [ ] @J4CTestingAgent: JIRA API token configured for AV11 project
- [ ] @J4CCoordinatorAgent: JIRA API token + dashboard access

**Verification**:
```bash
# Test JIRA access for each agent
curl -u "$AGENT_EMAIL:$JIRA_TOKEN" \
  https://aurigraphdlt.atlassian.net/rest/api/3/myself

# Should return: {"accountId": "...", "emailAddress": "..."}
```

**Contact**: JIRA Admin if access issues

---

### GitHub Repository Access
- [ ] All 4 agents: SSH keys configured for Aurigraph-DLT-Corp/Aurigraph-DLT
- [ ] All 4 agents: Can clone and push to repository
- [ ] All 4 agents: Protected branch rules understood (main requires PR review)

**Verification**:
```bash
# For each agent, test SSH access
ssh -T git@github.com
# Should return: "Hi [agent-name]! You've successfully authenticated..."

# Test clone
git clone git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git
# Should complete without password prompt
```

**Contact**: GitHub Org Admin if access issues

---

### V10 & V11 Service Credentials
- [ ] All 4 agents: SSH credentials for V10 production server
  - Host: [production-v10-host]
  - User: [username]
  - Port: [ssh-port]
  - Password stored securely (not in logs)

- [ ] All 4 agents: REST API credentials for V10 service
  - URL: https://v10-api.aurigraph.io/api/v10/
  - Auth: Bearer token or basic auth
  - Test endpoint: GET /health

- [ ] All 4 agents: V11 development environment credentials
  - V11 Quarkus service: http://localhost:9003 (dev) or https://v11-dev.aurigraph.io (staging)
  - Database (PostgreSQL): Host, port, username, password
  - Test: Can connect and run SELECT 1

**Verification**:
```bash
# Test V10 API
curl -H "Authorization: Bearer $V10_TOKEN" \
  https://v10-api.aurigraph.io/api/v10/health

# Test V11 database
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "SELECT 1"

# Test V11 Quarkus dev mode
curl http://localhost:9003/q/health
# Should return: {"status":"UP"}
```

---

### Keycloak/IAM Credentials
- [ ] All 4 agents: Keycloak URL: https://iam2.aurigraph.io
- [ ] All 4 agents: Test user account for JWT token generation
  - Username: [test-user]
  - Password: [test-password]
  - Realm: AWD (primary)

**Verification**:
```bash
# Obtain JWT token from Keycloak
curl -X POST https://iam2.aurigraph.io/realms/AWD/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=test-client" \
  -d "username=$TEST_USER" \
  -d "password=$TEST_PASSWORD" \
  -d "grant_type=password"

# Should return: {"access_token": "...", "token_type": "Bearer", ...}
```

**Contact**: Keycloak Admin if token issues

---

### Load Testing Tool Credentials
- [ ] Gatling or JMeter installed on agent machines
- [ ] Load testing tool can reach V11 gateway (http://localhost:9003 or staging URL)
- [ ] Load test configuration stored in repository (scripts/load-test/)

**Verification**:
```bash
# Check Gatling installation
gatling.sh -version

# Test connection to V11 gateway
curl http://localhost:9003/q/health
```

---

## ✅ Section 2: Development Environment (Complete by Dec 27)

### V11 Codebase Setup
- [ ] Repository cloned to all agent machines
- [ ] Branch: **V12** (or current development branch)
- [ ] Maven clean build successful
  ```bash
  cd aurigraph-av10-7/aurigraph-v11-standalone
  ./mvnw clean compile
  # Should complete without errors
  ```

- [ ] Quarkus dev mode starts successfully
  ```bash
  ./mvnw quarkus:dev
  # Should show: "Quarkus X.XX.X started"
  # Listen on: http://localhost:9003
  ```

- [ ] All unit tests pass
  ```bash
  ./mvnw test
  # Should show: "BUILD SUCCESS"
  ```

**Contact**: Tech Lead if build issues

---

### Database Setup (PostgreSQL)
- [ ] PostgreSQL server running (version 16+)
- [ ] Aurigraph database created
- [ ] Tables/schema initialized (Liquibase migrations run)
- [ ] Test connection from V11 service works

**Verification**:
```bash
# Connect to database
psql -h localhost -U aurigraph -d aurigraph
\dt  # List all tables
\q   # Quit

# Verify from V11 app
curl http://localhost:9003/api/v11/health
# Should show database connection status
```

**Contact**: Database Admin if connection issues

---

### IDE Configuration
- [ ] All agents: IntelliJ IDEA or VS Code with Java plugin
- [ ] Maven configured (settings.xml in ~/.m2/)
- [ ] Code formatter configured (follow CLAUDE.md conventions)
- [ ] Git configured (user.name, user.email set)

**Verification**:
```bash
git config --global user.name
git config --global user.email
# Should return configured values
```

---

## ✅ Section 3: Monitoring & Observability (Complete by Dec 28)

### Prometheus Setup
- [ ] Prometheus server running (http://localhost:9090)
- [ ] V11 metrics endpoint available (http://localhost:9003/q/metrics)
- [ ] Scrape configuration includes V11 service
- [ ] V10 metrics also scraped (if available)

**Verification**:
```bash
# Check V11 metrics endpoint
curl http://localhost:9003/q/metrics

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets
# Should show V11 service as UP
```

---

### Grafana Setup
- [ ] Grafana running (http://localhost:3000)
- [ ] Prometheus datasource configured
- [ ] Dashboards created/imported for:
  - **Gateway Metrics**: Latency (P50, P99, P99.9), TPS, error rate
  - **V11 System**: CPU, memory, JVM heap, GC pause time
  - **Database**: Connection pool usage, query latency
  - **Canary Deployment**: Traffic split (V10% vs V11%), error rate comparison

**Sample Dashboard Queries**:
```
# P99 Latency (last 5 minutes)
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# TPS (requests per second)
rate(http_requests_total[1m])

# Error Rate (%)
rate(http_requests_total{status=~"5.."}[1m]) / rate(http_requests_total[1m]) * 100
```

**Contact**: Monitoring team if dashboard issues

---

### Alerting Rules
- [ ] AlertManager configured
- [ ] Alert rules for:
  - P99 latency > 150ms (warning)
  - P99 latency > 300ms (critical)
  - Error rate > 1% (warning)
  - Error rate > 5% (critical)
  - Gateway down (critical)
  - Database unreachable (critical)

**Verification**:
```bash
# Check AlertManager config
curl http://localhost:9093/api/v1/alerts

# Check fired alerts
curl http://localhost:9090/api/v1/alerts
```

---

### Logging Setup
- [ ] Centralized logging (ELK stack or equivalent) accessible
- [ ] V11 logs flowing to central repository
- [ ] Log level configured (DEBUG for development, INFO for production)
- [ ] Application logs searchable by transaction ID or request ID

**Verification**:
```bash
# Check application logs
docker-compose logs -f quarkus-app

# Search for errors
docker-compose logs quarkus-app | grep ERROR
```

---

## ✅ Section 4: Testing Infrastructure (Complete by Dec 28)

### Load Testing Setup
- [ ] Gatling installed (version 3.9+) on load test machine
- [ ] Load test scripts created in repository:
  - `scripts/load-test/GatewayLoadTest.scala`
  - `scripts/load-test/CanaryLoadTest.scala`
  - `scripts/load-test/SyncLoadTest.scala`

- [ ] Load test can target:
  - Local V11 (http://localhost:9003)
  - Staging V11 (https://v11-staging.aurigraph.io)
  - Production V11 (https://dlt.aurigraph.io)

**Verification**:
```bash
# Run a 1-minute warm-up load test
cd scripts/load-test
./gradlew gatlingRun -Dusers=100 -Drps=1000 -Dduration=60
# Should complete without errors, show results HTML
```

---

### Integration Test Environment
- [ ] Both V10 and V11 services running in test environment
- [ ] Test database (PostgreSQL) provisioned separately from dev database
- [ ] Test data seeded (100+ sample transactions, consensus state, RWA tokens)
- [ ] Integration test suite can connect to both services

**Verification**:
```bash
# Run integration tests
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw verify -Pintegration-test
# Should show: "BUILD SUCCESS"
```

---

### Canary Deployment Test Environment
- [ ] NGINX reverse proxy configured with traffic shaping
- [ ] NGINX config can route 1% → 10% → 100% traffic to V11
- [ ] Health checks configured for both V10 and V11
- [ ] Automatic failover to 100% V10 if V11 error rate >1%

**Sample NGINX config**:
```nginx
upstream v10_backend {
  server v10-service:9003;
}

upstream v11_backend {
  server v11-service:9003;
}

# Traffic shaping: V10=99%, V11=1% initially
upstream backend {
  server v10-service:9003 weight=99;
  server v11-service:9003 weight=1;
}

server {
  listen 80;
  location /api/v11 {
    proxy_pass http://backend;
    proxy_pass_request_headers on;
  }
}
```

**Verification**:
```bash
# Test traffic routing
for i in {1..100}; do curl http://localhost/api/v11/health; done | sort | uniq -c
# Should show ~99 hits to V10, ~1 hit to V11 (roughly)
```

---

## ✅ Section 5: Communication & Escalation (Complete by Dec 29)

### Slack Channels Created
- [ ] #aurigraph-v11-migration (main channel)
- [ ] #aurigraph-v11-weekly (weekly reports)
- [ ] #aurigraph-v11-alerts (critical alerts)
- [ ] #aurigraph-v11-on-call (on-call rotation)

**Members**:
- [ ] All 4 Sprint 19 agents
- [ ] Tech lead
- [ ] Project manager
- [ ] Product owner
- [ ] Executive sponsor

---

### Email Distribution List
- [ ] Created: sprint-19-team@aurigraph.io
- [ ] Members: All above + leadership
- [ ] Used for: Daily reports, go/no-go decisions, escalations

---

### Calendar Invites Sent
- [ ] Daily standup: 09:00 AM EST, Monday-Friday
  - Duration: 20 minutes
  - Attendees: All 4 agents + coordinator
  - Location/Video call: [Zoom/Teams URL]

- [ ] Weekly delivery meeting: Friday 2:00 PM EST
  - Duration: 30 minutes
  - Attendees: Sprint leads + project manager + sponsor
  - Location: [Zoom/Teams URL]

- [ ] Go/No-Go gate: Friday, Day 10 at 08:00 AM
  - Duration: 4 hours (08:00 AM - 12:00 PM)
  - Attendees: All agents + stakeholders
  - Location: [Zoom/Teams URL]

---

### Escalation Contacts Briefed
- [ ] On-call Tech Lead identified and briefed on:
  - Sprint 19 critical path
  - Common issues and resolutions
  - Escalation criteria (blocker >2 hours)
  - Contact method (phone, Slack, etc.)

- [ ] Project Manager briefed on:
  - Timeline risks (P0 gaps, etc.)
  - Go/no-go gate criteria
  - Escalation path (scope/schedule changes)

- [ ] Executive Sponsor briefed on:
  - 10-day execution plan
  - Go/no-go decision process
  - Decision needed on Day 10 at 12:00 PM
  - Impact if NO-GO (Sprint 19 extends 3-5 days)

---

## ✅ Section 6: Documentation & Handoff (Complete by Dec 30)

### Reference Documentation Available
- [ ] `AGENT-SPRINT-19-DEPLOYMENT-GUIDE.md` - Day-by-day tasks
- [ ] `SPARC-METHODOLOGY-FRAMEWORK.md` - 5-phase development process
- [ ] `AGENT-ASSIGNMENT-COORDINATION-PLAN.md` - Agent coordination
- [ ] `JIRA-TICKET-SME-ASSIGNMENTS.md` - Task assignments
- [ ] `docs/CLAUDE.md` - Code style & conventions
- [ ] `DEVELOPMENT.md` - Development setup guide
- [ ] `ARCHITECTURE.md` - System architecture overview

**Location**: `/docs/sprints/` (agents should bookmark this)

---

### Pre-Sprint Briefing Completed
- [ ] All 4 agents read AGENT-SPRINT-19-DEPLOYMENT-GUIDE.md
- [ ] All agents understand their specific day-by-day tasks
- [ ] All agents reviewed risk mitigation procedures
- [ ] All agents confirmed readiness (survey or Slack +1)

---

### JIRA Setup Completed
- [ ] 74 tickets created (1 Epic + 17 Stories + 56 Tasks)
- [ ] Story points added to all 17 main stories (251 total)
- [ ] Dependencies linked (33 critical paths)
- [ ] SME assignments completed (11 agents assigned)
- [ ] Sprint 19 board created with 78 story point target
- [ ] Boards/backlogs accessible to all agents

**Verification**:
```bash
# Check JIRA board
curl -H "Authorization: Basic $JIRA_AUTH" \
  https://aurigraphdlt.atlassian.net/rest/api/3/board/[board-id] \
  | jq '.name'
# Should return: "Sprint 19 - REST-to-gRPC Gateway"
```

---

## ✅ Section 7: V10 System Validation (Complete by Dec 30)

### V10 API Accessibility
- [ ] V10 REST API running and responding to health checks
- [ ] All 50+ REST endpoints documented and accessible
- [ ] JWT token generation working (Keycloak integration)
- [ ] V10 database accessible for data extraction

**Verification**:
```bash
# Check V10 health
curl https://v10-api.aurigraph.io/api/v10/health

# Check V10 endpoints
curl -H "Authorization: Bearer $TOKEN" \
  https://v10-api.aurigraph.io/api/v10/transactions
# Should return transaction list
```

---

### V10 Data Extraction
- [ ] Can extract transaction history (last 30 days minimum)
- [ ] Can extract consensus state (current state + history)
- [ ] Can extract RWA registry (all tokens + balances)
- [ ] Can extract bridge state (if applicable)

**Verification**:
```bash
# Extract sample data
curl -H "Authorization: Bearer $TOKEN" \
  "https://v10-api.aurigraph.io/api/v10/transactions?limit=100"

# Verify response contains expected fields
# Expected: id, from, to, amount, timestamp, status
```

---

### V10 Backup Completed
- [ ] Full database backup of V10 taken
- [ ] Backup stored in secure location
- [ ] Backup restoration tested
- [ ] Backup documented in runbook

**Verification**:
```bash
# Check backup location and size
ls -lh /backups/v10/latest.sql.gz
# Should show recent timestamp and reasonable size
```

---

## ✅ Section 8: V11 Baseline Validation (Complete by Dec 30)

### V11 Service Health
- [ ] V11 Quarkus service starts without errors
- [ ] V11 HTTP/2 endpoint responding on port 9003
- [ ] V11 health endpoint returns status=UP
- [ ] V11 metrics endpoint available (Prometheus format)

**Verification**:
```bash
# Start V11 dev mode
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev

# In another terminal:
curl http://localhost:9003/q/health
# Should return: {"status":"UP"}

curl http://localhost:9003/q/metrics | head -20
# Should show Prometheus metrics
```

---

### V11 Database Initialized
- [ ] PostgreSQL schema created via Liquibase
- [ ] All tables exist (transactions, consensus, rwa_tokens, bridges)
- [ ] Foreign key constraints configured
- [ ] Indexes created for performance

**Verification**:
```bash
psql -h localhost -U aurigraph -d aurigraph
\dt
# Should show tables:
# - transactions
# - consensus_state
# - rwa_tokens
# - bridge_state

\di
# Should show indexes on frequently queried columns
```

---

### V11 Baseline Performance Captured
- [ ] Current V11 TPS recorded (baseline)
- [ ] Current V11 P99 latency recorded
- [ ] Current memory usage recorded
- [ ] Current CPU usage recorded
- **Baseline Purpose**: To measure improvement post-gateway/sync

**Sample Baseline**:
```
V11 Baseline (pre-Sprint 19):
- TPS: 50K (existing endpoints only)
- P99 Latency: 80ms (internal gRPC calls)
- Memory: 256MB
- CPU: 15%
```

---

## ✅ Section 9: Risk Mitigation Prep (Complete by Dec 31)

### P0 Gap Closure Prep
- [ ] V10 REST API documentation extracted
- [ ] Protocol Buffer files validated to compile
- [ ] Keycloak test account created
- [ ] NGINX canary config prepared (not yet deployed)

**Location**: `docs/sprints/P0-GAP-CLOSURE-PREP.md`

---

### Rollback Procedures Ready
- [ ] V10 production rollback plan documented
- [ ] V11 production rollback plan documented
- [ ] Both plans tested (not on production)
- [ ] Decision criteria for rollback clear (error rate >5%? latency >500ms?)

**Location**: `docs/sprints/ROLLBACK-PROCEDURES.md`

---

### Incident Response Plan
- [ ] On-call rotation scheduled (24/7 during Sprint 19)
- [ ] Incident escalation procedures documented
- [ ] Runbooks for common issues created:
  - "Gateway latency spike"
  - "Data sync lag >10 seconds"
  - "V11 service crash"
  - "Database connection pool exhausted"

**Location**: `docs/sprints/INCIDENT-RESPONSE-RUNBOOKS.md`

---

## ✅ Final Sign-Off

### Readiness Review Meeting (Dec 31, 2:00 PM)

**Attendees**: Tech lead, project manager, executive sponsor, all 4 agents

**Agenda**:
1. Review all 9 sections above (15 mins)
2. Address any incomplete items (15 mins)
3. Confirm all agents ready (5 mins)
4. **Sign-off: "Sprint 19 ready to deploy"** or escalate blockers

**Completion Criteria**:
- [ ] ≥95% of all checklist items completed ✅
- [ ] All critical items (credentials, tools, JIRA) completed ✅
- [ ] All agents confirmed ready via Slack reaction ✅
- [ ] Tech lead confirmed infrastructure ready ✅
- [ ] Project manager confirmed timeline realistic ✅
- [ ] Executive sponsor gave final approval ✅

**If any blocker**: Schedule immediate resolution task, delay start 1-2 days

---

## 📞 Escalation for Incomplete Items

**If item incomplete by Dec 31**:

1. **Low risk** (optional items like specific Grafana dashboards):
   - Defer to Day 1 of Sprint 19 (agents create during gaps)

2. **Medium risk** (infrastructure items like load test tool):
   - Extend Dec 31 deadline by 1 day
   - Start Sprint 19 on Jan 2 instead of Jan 1

3. **High risk** (credentials, JIRA access, V10 API access):
   - **BLOCKER** - Do not start Sprint 19
   - Escalate to executive sponsor immediately
   - Resolve before Jan 1

---

## 📋 Checklist Summary

| Section | Items | Status | Target Date |
|---------|-------|--------|------------|
| 1. Credentials | 7 | ☐ | Dec 27 |
| 2. Dev Environment | 6 | ☐ | Dec 27 |
| 3. Monitoring | 5 | ☐ | Dec 28 |
| 4. Testing | 4 | ☐ | Dec 28 |
| 5. Communication | 3 | ☐ | Dec 29 |
| 6. Documentation | 3 | ☐ | Dec 30 |
| 7. V10 Validation | 3 | ☐ | Dec 30 |
| 8. V11 Validation | 3 | ☐ | Dec 30 |
| 9. Risk Mitigation | 3 | ☐ | Dec 31 |
| **TOTAL** | **37** | ☐ | **Dec 31** |

**Overall Status**: 🟡 Ready for Pre-Deployment Phase

---

**Prepared**: December 25, 2025  
**For**: Sprint 19 Deployment  
**Target Completion**: December 31, 2025  
**Sprint 19 Start Date**: January 1, 2026 (pending checklist completion)

