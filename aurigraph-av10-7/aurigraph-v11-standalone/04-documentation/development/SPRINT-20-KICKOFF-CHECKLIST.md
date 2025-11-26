# Sprint 20: Portal Integration - Team Kickoff Checklist

**Sprint Duration:** 3 weeks (21 days)
**Sprint Goal:** Integrate React Enterprise Portal with v11.4.4 Backend
**Team Size:** 2-3 developers
**Total Effort:** 30-38 hours

---

## Pre-Sprint Verification (Complete BEFORE Starting)

### 1. Backend Health Check

**Objective:** Verify v11.4.4 backend is running and all endpoints are accessible.

#### Step 1: Start Backend Service
```bash
# Navigate to backend directory
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Start Quarkus in development mode
./mvnw clean quarkus:dev

# Expected output:
# [INFO] Quarkus augmentation completed in Xms
# Listening on: http://0.0.0.0:9003
```

**Success Criteria:**
- ✅ Backend starts without errors
- ✅ Console shows "Listening on: http://0.0.0.0:9003"
- ✅ No compilation errors in Maven output

---

#### Step 2: Test Core Endpoints

**Health Check:**
```bash
curl http://localhost:9003/q/health
```

**Expected Response:**
```json
{
  "status": "UP",
  "checks": [...]
}
```

**Platform Status:**
```bash
curl http://localhost:9003/api/v11/status
```

**Expected Response:**
```json
{
  "status": "running",
  "version": "11.4.4",
  "uptime": "..."
}
```

**Authentication Endpoint:**
```bash
curl -v -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```

**Expected Response:**
```json
{
  "sessionId": "...",
  "username": "demo",
  "success": true,
  "message": "Login successful"
}
```

**IMPORTANT:** Look for `Set-Cookie: session_id=...` header in response!

---

#### Step 3: Verify WebSocket Endpoints

**Test WebSocket with websocat:**
```bash
# Install websocat if needed
brew install websocat  # macOS
# or
cargo install websocat # Cross-platform

# Test transaction WebSocket
websocat ws://localhost:9003/ws/transactions
```

**Expected Behavior:**
- Connection opens successfully
- Messages appear (if backend is generating test data)
- No immediate disconnection

**Alternative Test (using wscat):**
```bash
npm install -g wscat
wscat -c ws://localhost:9003/ws/transactions
```

---

### 2. Database Verification

**Objective:** Ensure PostgreSQL is running and users exist for testing.

#### Check Database Connection
```bash
# From backend directory
./mvnw quarkus:dev

# Check logs for:
# "Database connection established"
# "Flyway migration applied successfully"
```

#### Verify Test Users Exist
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d aurigraph

# Check users table
SELECT id, username, email, role FROM users LIMIT 5;

# Expected result: At least one user (demo / demo@aurigraph.io)
```

**If no users exist, run:**
```bash
# Backend will auto-create demo user on first start
# Or manually insert:
INSERT INTO users (username, email, password_hash, role)
VALUES ('demo', 'demo@aurigraph.io', '$2a$10$...', 'USER');
```

---

### 3. Frontend Environment Check

**Objective:** Verify Node.js, npm, and dependencies are ready.

#### Step 1: Check Node.js Version
```bash
node --version
# Expected: v20.x or higher

npm --version
# Expected: 10.x or higher
```

**If wrong version:**
```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 20
nvm install 20
nvm use 20
```

---

#### Step 2: Install Frontend Dependencies
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal

# Clean install
rm -rf node_modules package-lock.json
npm install

# Expected: No errors, all dependencies installed
```

---

#### Step 3: Start Frontend Development Server
```bash
npm run dev

# Expected output:
#   VITE v5.0.8  ready in Xms
#
#   ➜  Local:   http://localhost:3000/
#   ➜  Network: use --host to expose
```

**Success Criteria:**
- ✅ Vite starts without errors
- ✅ No TypeScript compilation errors
- ✅ Browser opens to http://localhost:3000

---

### 4. CORS Configuration Verification

**Objective:** Ensure backend allows frontend origin for API calls.

#### Check Backend CORS Settings

**File:** `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/src/main/resources/application.properties`

**Required Configuration:**
```properties
quarkus.http.cors=true
quarkus.http.cors.origins=http://localhost:3000,http://localhost:3001,https://portal.aurigraph.io
quarkus.http.cors.methods=GET,POST,PUT,DELETE,OPTIONS
quarkus.http.cors.headers=Content-Type,Authorization,X-API-Key,Cookie
quarkus.http.cors.exposed-headers=Set-Cookie
quarkus.http.cors.access-control-allow-credentials=true
```

**Test CORS with curl:**
```bash
curl -v -X OPTIONS http://localhost:9003/api/v11/login/authenticate \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"

# Look for:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Credentials: true
```

---

### 5. Network Connectivity Test

**Objective:** Verify frontend can reach backend.

#### Test from Browser Console
```javascript
// Open http://localhost:3000 in browser
// Open Developer Tools > Console
// Run:

fetch('http://localhost:9003/api/v11/status')
  .then(r => r.json())
  .then(d => console.log('Backend Response:', d))
  .catch(e => console.error('Backend Error:', e))

// Expected: Backend response with status "running"
```

#### Test Authentication Flow
```javascript
fetch('http://localhost:9003/api/v11/login/authenticate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include', // IMPORTANT for cookies
  body: JSON.stringify({
    username: 'demo',
    password: 'demo123'
  })
})
  .then(r => r.json())
  .then(d => console.log('Login Response:', d))
  .catch(e => console.error('Login Error:', e))

// Expected: { sessionId: "...", username: "demo", success: true }
```

---

## Team Member Role Assignments

### Developer 1: Frontend Lead (Authentication & API Integration)

**Primary Responsibilities:**
- Phase 1: Authentication Integration (Week 1)
- API client configuration with session management
- Redux auth slice updates
- Login/logout functionality

**Daily Tasks:**
- Update `api.ts` for cookie credentials
- Fix Login.tsx endpoint
- Add session verification to App.tsx
- Write unit tests for auth flow

**Communication:**
- Daily standups: Report auth integration progress
- Code reviews: Review Developer 2's WebSocket work
- Blockers: Report CORS or cookie issues immediately

---

### Developer 2: Frontend Developer (Real-time Features & Testing)

**Primary Responsibilities:**
- Phase 2: WebSocket Integration (Week 2)
- React components for live data
- E2E test suite (Week 3)

**Daily Tasks:**
- Create WebSocket service class
- Build useWebSocket React hook
- Create LiveTransactionFeed & LiveMetricsDashboard components
- Write Playwright E2E tests

**Communication:**
- Daily standups: Report component & test progress
- Code reviews: Review Developer 1's auth work
- Blockers: Report WebSocket connection issues immediately

---

### Developer 3 (Optional): Full-Stack Support (Backend & DevOps)

**Primary Responsibilities:**
- Backend troubleshooting
- CORS configuration fixes
- CI/CD pipeline setup
- Production deployment preparation

**Daily Tasks:**
- Monitor backend logs for errors
- Fix CORS issues if frontend reports problems
- Set up GitHub Actions for E2E tests
- Prepare production deployment checklist

**Communication:**
- Daily standups: Report backend health & issues
- On-call: Available for urgent backend fixes
- Documentation: Update deployment guides

---

## Development Environment Setup Instructions

### Step 1: Clone Repository (If New Team Member)
```bash
# Clone repo
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Checkout main branch
git checkout main
git pull origin main
```

---

### Step 2: Install Backend Dependencies

#### macOS
```bash
# Install Java 21
brew install openjdk@21

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
java --version
# Expected: openjdk 21.0.x
```

#### Linux (Ubuntu/Debian)
```bash
# Install Java 21
sudo apt update
sudo apt install openjdk-21-jdk

# Verify
java --version
```

#### Windows
```bash
# Download and install from:
# https://adoptium.net/temurin/releases/?version=21
```

---

### Step 3: Install Frontend Dependencies

```bash
cd enterprise-portal

# Install Node.js 20 (if not installed)
# macOS
brew install node@20

# Linux
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install frontend packages
npm install
```

---

### Step 4: Configure Environment Variables

#### Backend Configuration
**File:** `src/main/resources/application.properties`

**Critical Settings:**
```properties
# HTTP Port
quarkus.http.port=9003

# CORS (MUST BE SET FOR FRONTEND)
quarkus.http.cors=true
quarkus.http.cors.origins=http://localhost:3000
quarkus.http.cors.access-control-allow-credentials=true

# Database
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/aurigraph
quarkus.datasource.username=postgres
quarkus.datasource.password=postgres

# Session Configuration
quarkus.session.timeout=8H
quarkus.session.cookie-name=session_id
quarkus.session.cookie-http-only=true
```

---

#### Frontend Configuration
**File:** `enterprise-portal/.env`

**Create file with:**
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:9003/api/v11
VITE_WS_BASE_URL=ws://localhost:9003

# Feature Flags
VITE_WEBSOCKET_ENABLED=true
VITE_REAL_TIME_METRICS=true

# Optional: API Key (if backend requires)
VITE_REACT_APP_API_KEY=your-api-key-here
```

---

### Step 5: IDE Configuration

#### VS Code Settings (Recommended)

**Install Extensions:**
```bash
# Essential
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-playwright.playwright

# Java Support
code --install-extension vscjava.vscode-java-pack

# TypeScript Support
code --install-extension ms-vscode.vscode-typescript-next
```

**Workspace Settings (`.vscode/settings.json`):**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-21",
      "path": "/opt/homebrew/opt/openjdk@21"
    }
  ]
}
```

---

#### TypeScript Configuration Check

**File:** `enterprise-portal/tsconfig.json`

**Verify settings:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

### Step 6: Verify Local Setup

#### Run Full Stack Locally

**Terminal 1 (Backend):**
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean quarkus:dev

# Wait for: "Listening on: http://0.0.0.0:9003"
```

**Terminal 2 (Frontend):**
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal
npm run dev

# Wait for: "Local: http://localhost:3000/"
```

**Terminal 3 (Testing):**
```bash
# Test backend health
curl http://localhost:9003/q/health

# Test frontend
curl http://localhost:3000

# Test authentication
curl -v -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```

---

## Backend Connection Verification Steps

### Step 1: Verify REST API Endpoints

**Test each endpoint with curl:**

```bash
# 1. Platform Status
curl http://localhost:9003/api/v11/status

# Expected: {"status":"running","version":"11.4.4",...}

# 2. Authentication
curl -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Expected: {"sessionId":"...","success":true}

# 3. Demos List (requires auth - use session cookie from #2)
curl http://localhost:9003/api/v11/demos \
  -H "Cookie: session_id=YOUR_SESSION_ID"

# Expected: [{"id":"...","name":"..."}]

# 4. Live Validators
curl http://localhost:9003/api/v11/live/validators

# Expected: [{"id":"...","status":"active"}]
```

---

### Step 2: Test WebSocket Connections

**Using websocat:**
```bash
# Transactions WebSocket
websocat ws://localhost:9003/ws/transactions

# Expected: Real-time transaction messages
# {"type":"NEW_TRANSACTION","payload":{...},"timestamp":...}

# Validators WebSocket
websocat ws://localhost:9003/ws/validators

# Metrics WebSocket
websocat ws://localhost:9003/ws/metrics

# Press Ctrl+C to disconnect
```

---

### Step 3: Verify Database State

**Check users exist:**
```bash
psql -h localhost -U postgres -d aurigraph

# Run query:
SELECT username, email, role FROM users;

# Expected: At least 'demo' user exists
```

**Check demos exist:**
```bash
# Run query:
SELECT id, demo_name, status FROM demos LIMIT 5;

# Expected: Some demo records (or empty is OK)
```

---

## Local Testing Setup

### Unit Tests Setup

**Backend (Java + JUnit):**
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=LoginResourceTest

# Expected: All tests pass
```

**Frontend (Vitest + React Testing Library):**
```bash
cd enterprise-portal

# Run all tests
npm test

# Run specific test file
npm test -- Login.test.tsx

# Run with coverage
npm run test:coverage

# Expected: All tests pass, coverage > 80%
```

---

### E2E Tests Setup (Week 3)

**Install Playwright:**
```bash
cd enterprise-portal

# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

**Create test directory:**
```bash
mkdir -p e2e
touch e2e/auth.spec.ts
touch e2e/demos.spec.ts
touch e2e/websockets.spec.ts
```

---

## Common Issues and Solutions

### Issue 1: Backend Won't Start

**Symptoms:**
- Maven build fails
- Port 9003 already in use

**Solutions:**
```bash
# Check if port is in use
lsof -i :9003

# Kill process using port
kill -9 <PID>

# Or use different port in application.properties:
quarkus.http.port=9004
```

---

### Issue 2: Frontend Can't Connect to Backend

**Symptoms:**
- CORS errors in browser console
- Network request fails

**Solutions:**
1. Verify CORS configuration in `application.properties`
2. Check backend is running on port 9003
3. Clear browser cache (Cmd+Shift+R on macOS)
4. Check `.env` file has correct `VITE_API_BASE_URL`

```bash
# Test CORS with curl
curl -v -X OPTIONS http://localhost:9003/api/v11/login/authenticate \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```

---

### Issue 3: Session Cookie Not Saved

**Symptoms:**
- Login succeeds but cookie not in browser
- API calls return 401

**Solutions:**
1. Check `credentials: 'include'` in fetch calls
2. Verify backend sends `Set-Cookie` header
3. Check browser doesn't block cookies (Privacy settings)

```javascript
// In Login.tsx, ensure fetch has:
fetch(url, {
  method: 'POST',
  credentials: 'include', // REQUIRED
  body: JSON.stringify(data)
})
```

---

### Issue 4: WebSocket Connection Fails

**Symptoms:**
- WebSocket shows "Disconnected"
- Console error: "WebSocket connection failed"

**Solutions:**
```bash
# Test WebSocket manually
websocat ws://localhost:9003/ws/transactions

# Check backend logs for WebSocket errors
tail -f target/quarkus.log | grep WebSocket
```

---

## Success Checklist (Complete Before Starting Development)

### Pre-Development Checklist
- [ ] Backend starts successfully on port 9003
- [ ] Backend health endpoint responds: `curl http://localhost:9003/q/health`
- [ ] Backend authentication works: Demo user can log in
- [ ] Backend WebSocket connects: `websocat ws://localhost:9003/ws/transactions`
- [ ] Frontend starts successfully on port 3000
- [ ] Frontend can fetch backend status: Check browser console
- [ ] CORS is configured: No CORS errors in browser
- [ ] Session cookies work: Cookie appears in DevTools after login
- [ ] Database is running: PostgreSQL on port 5432
- [ ] Test users exist: `demo` user in database

### Team Readiness Checklist
- [ ] All team members have access to GitHub repo
- [ ] All team members have local environment working
- [ ] All team members completed pre-sprint verification
- [ ] Roles assigned: Frontend Lead, Frontend Dev, Full-Stack (optional)
- [ ] Communication channels set up: Slack/Teams/Discord
- [ ] Daily standup time scheduled
- [ ] Sprint board created in JIRA/Trello
- [ ] Week 1, 2, 3 milestones defined

### Documentation Access
- [ ] Team has access to Sprint 20 Plan: `SPRINT-20-PORTAL-INTEGRATION-PLAN.md`
- [ ] Team has access to API docs: `ENTERPRISE-PORTAL-README.md`
- [ ] Team has access to backend docs: `README.md` in backend root
- [ ] Team has access to credentials: `/Users/subbujois/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md`

---

## Next Steps After Kickoff

### Immediate Actions (Day 1)
1. **All team members:** Complete pre-sprint verification checklist
2. **Frontend Lead:** Start Phase 1 Task 1 (Update API client for session auth)
3. **Frontend Dev:** Set up Playwright test framework
4. **Full-Stack:** Monitor backend health and fix any startup issues

### Day 2-3 Actions
1. **Frontend Lead:** Complete Login component endpoint fixes
2. **Frontend Dev:** Create WebSocket service skeleton
3. **Full-Stack:** Document any backend quirks or issues found

### Week 1 Goal
- ✅ Authentication fully integrated
- ✅ Session management working
- ✅ Login/logout flows tested
- ✅ All team members confident in setup

---

## Contact Information

### Technical Leads
- **Project Architect:** See JIRA board
- **Backend Lead:** See Credentials.md
- **Frontend Lead:** Assigned at kickoff

### Resources
- **JIRA Board:** https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
- **GitHub Repo:** https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **Credentials:** `/Users/subbujois/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md`
- **Sprint Plan:** `SPRINT-20-PORTAL-INTEGRATION-PLAN.md` (this directory)
- **Backend Docs:** `/aurigraph-av10-7/aurigraph-v11-standalone/README.md`

---

## Kickoff Meeting Agenda

### Duration: 60 minutes

**Agenda:**
1. **Introduction (5 min):** Team introductions, roles
2. **Sprint Overview (10 min):** Goals, deliverables, timeline
3. **Technical Walkthrough (20 min):** Architecture, backend, frontend
4. **Environment Setup (15 min):** Live demo of setup process
5. **Pre-Sprint Verification (5 min):** Walk through checklist
6. **Q&A (5 min):** Answer questions, clarify doubts

**Post-Meeting:**
- All team members complete pre-sprint verification
- Report any setup issues in Slack/Teams
- Schedule first daily standup (15 minutes daily)

---

## Daily Standup Format (15 minutes)

**Each team member answers:**
1. **What I did yesterday:** Completed tasks from Phase 1/2/3
2. **What I'm doing today:** Current task from implementation checklist
3. **Blockers:** Any issues preventing progress

**Standup Schedule:**
- **Time:** 10:00 AM daily (adjust to team timezone)
- **Duration:** 15 minutes (strict)
- **Location:** Zoom/Teams/Discord
- **Attendance:** Mandatory for all team members

---

**END OF KICKOFF CHECKLIST**

**Next Document:** Read `PHASE-1-IMPLEMENTATION-CHECKLIST.md` for Week 1 tasks.
