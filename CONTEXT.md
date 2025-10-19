# CONTEXT.md - Enterprise Portal Session Context

**Purpose**: Maintain context across sessions for continuity
**Last Updated**: October 19, 2025
**Project**: Aurigraph V11 Enterprise Portal
**Version**: V4.3.2

---

## 📋 QUICK START - READ THIS FIRST

**When resuming this project, read this file first to restore full context.**

### Current Status (As of October 19, 2025)

**Production**: ✅ LIVE at https://dlt.aurigraph.io
**Testing**: ⏳ Sprint 1 - 50% complete (70+ tests implemented)
**Coverage**: 🎯 Target 85%+ (measurement pending)
**Next Task**: Complete Performance.test.tsx and Settings.test.tsx

---

## 🎯 IMMEDIATE NEXT STEPS

**Priority Tasks** (Do these first):

1. **Complete Sprint 1 Core Page Tests**
   ```bash
   cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal
   # Create src/__tests__/pages/Performance.test.tsx (~25 tests)
   # Create src/__tests__/pages/Settings.test.tsx (~35 tests)
   ```

2. **Run Coverage Measurement**
   ```bash
   npm run test:coverage
   open coverage/index.html
   ```

3. **Update JIRA** with test completion progress
   - Issue: AV11-421
   - Add comment with coverage results

4. **Set up CI/CD** (GitHub Actions workflow)
   - Create `.github/workflows/test.yml`
   - Automate test runs on push/PR

---

## 📊 PROJECT OVERVIEW

### What is Aurigraph Enterprise Portal?

**Purpose**: Enterprise management portal for Aurigraph V11 blockchain platform
**Version**: V4.3.2
**Technology**: React 18 + TypeScript + Material-UI + Vite
**Backend**: Java/Quarkus V11 (port 9003)

**Key Features**:
- 23 Pages across 6 categories
- Real-time blockchain metrics
- Node management
- Transaction monitoring
- Performance analytics
- RWA tokenization
- Security audit logs

### Production Deployment

**Live Portal**: https://dlt.aurigraph.io
**API Backend**: https://dlt.aurigraph.io/api/v11
**Deployment Date**: October 19, 2025 16:10 IST
**Status**: Operational (58ms response time)
**Infrastructure**:
- Server: Ubuntu 24.04.3 LTS (49 Gi RAM, 16 vCPU)
- Web Server: Nginx 1.24.0 with HTTP/2 + TLS 1.3
- Backend: Quarkus V11 on port 9003

### NGINX Proxy Configuration

**Location**: `enterprise-portal/nginx/`
**Configuration Files**:
- `aurigraph-portal.conf` - Main NGINX configuration with security, rate limiting, firewall
- `deploy-nginx.sh` - Automated deployment script with backup/rollback
- `setup-firewall.sh` - UFW firewall configuration for production
- `README.md` - Complete documentation (516 lines)
- `QUICK_START.md` - Quick reference guide

**Key Features**:
- ✅ Reverse proxy for V11 backend (port 9003)
- ✅ Rate limiting: 100 req/s API, 10 req/s admin, 5 req/m auth
- ✅ IP-based firewall for admin endpoints
- ✅ SSL/TLS 1.2/1.3 with modern cipher suites
- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ Gzip compression for performance
- ✅ Static asset caching (1 year)
- ✅ WebSocket support for real-time updates

**Deployment**:
```bash
cd enterprise-portal/nginx/
./deploy-nginx.sh --test     # Test configuration
./deploy-nginx.sh --deploy   # Deploy to production
./deploy-nginx.sh --status   # Check status
```

---

## 🗂️ PROJECT STRUCTURE

### Repository Information

**Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
**Branch**: main
**JIRA Project**: AV11
**Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
**Primary Issue**: [AV11-421](https://aurigraphdlt.atlassian.net/browse/AV11-421)

### Directory Structure

```
Aurigraph-DLT/
├── aurigraph-av10-7/
│   └── aurigraph-v11-standalone/
│       └── enterprise-portal/          # Main application
│           ├── src/
│           │   ├── pages/              # 23 pages (all deployed)
│           │   ├── components/
│           │   ├── services/
│           │   ├── __tests__/          # Test files ⭐
│           │   │   ├── utils/
│           │   │   │   ├── test-utils.tsx
│           │   │   │   └── mockData.ts
│           │   │   └── pages/
│           │   │       ├── Dashboard.test.tsx      ✅ 30+ tests
│           │   │       ├── Transactions.test.tsx   ✅ 40+ tests
│           │   │       ├── Performance.test.tsx    ⏳ Pending
│           │   │       └── Settings.test.tsx       ⏳ Pending
│           │   ├── mocks/
│           │   │   ├── server.ts       # MSW server
│           │   │   └── handlers.ts     # 15+ API mocks
│           │   └── setupTests.ts       # Test environment
│           ├── vitest.config.ts        # Test config
│           ├── package.json            # Dependencies
│           └── dist/                   # Production build
│
├── doc/
│   └── Credentials.md                  # All credentials ⚠️
│
├── DEPLOYMENT_LOG.md                   # 425 lines
├── TEST_PLAN.md                        # 2,173 lines ⭐
├── TEST_PLAN_SUMMARY.md                # 707 lines
├── TESTING_SETUP_COMPLETE.md           # 464 lines
├── SESSION_SUMMARY.md                  # 640 lines
├── CONTEXT.md                          # This file
└── CLAUDE.md                           # Project instructions

⭐ = Critical for current work
⚠️ = Sensitive information
```

---

## 🧪 TESTING SETUP (MEMORIZED)

### Testing Stack

**Framework**: Vitest 1.6.1 (5-10x faster than Jest)
**Component Testing**: @testing-library/react 14.3.1
**API Mocking**: MSW 2.11.5
**DOM**: jsdom 23.2.0

### Test Commands

```bash
# Watch mode (development)
npm test

# Single run (CI)
npm run test:run

# Coverage report
npm run test:coverage

# Interactive UI
npm run test:ui
```

### Coverage Thresholds

| Metric | Target | Strict |
|--------|--------|--------|
| Lines | 85% | Yes |
| Functions | 85% | Yes |
| Branches | 80% | Yes |
| Statements | 85% | Yes |

### Mock API Endpoints (15+)

**Configured in**: `src/mocks/handlers.ts`

1. `GET /api/v11/health` - Health status
2. `GET /api/v11/info` - System information
3. `GET /api/v11/stats` - Performance statistics
4. `GET /api/v11/live/consensus` - Live consensus data
5. `GET /api/v11/transactions` - Transaction list
6. `GET /api/v11/nodes` - Node management
7. `GET /api/v11/analytics/metrics` - Analytics data
8. `GET /api/v11/security/audit-logs` - Security logs
9. `GET /api/v11/settings/system` - Get settings
10. `POST /api/v11/settings/system` - Update settings
11. `POST /api/v11/auth/login` - Authentication
12. `GET /api/v11/error/404` - Not Found (error test)
13. `GET /api/v11/error/500` - Server Error (error test)
14. + More endpoints as needed

### Test Utilities

**Location**: `src/__tests__/utils/`

**test-utils.tsx**:
- `renderWithProviders()` - Custom render with Redux, Router, MUI Theme
- `createMockStore()` - Mock Redux store creation

**mockData.ts**:
- Pre-configured mock data for all API responses
- Factory functions: `createMockTransaction()`, `createMockNode()`
- 15+ mock data objects

---

## 📈 CURRENT PROGRESS

### Sprint 1: Core Pages & Foundation (Weeks 1-2)

**Target**: 130+ tests, 85% coverage for core pages

**Progress**:
- ✅ Test utilities created
- ✅ Dashboard.test.tsx - 30+ tests (COMPLETE)
- ✅ Transactions.test.tsx - 40+ tests (COMPLETE)
- ⏳ Performance.test.tsx - 0 tests (PENDING)
- ⏳ Settings.test.tsx - 0 tests (PENDING)

**Current**: 70/130 tests (54% complete)

### Test Plan Overview

**Document**: TEST_PLAN.md (2,173 lines)

**16-Week Sprint Plan**:
- Sprint 1-2: Core Pages (Weeks 1-2) ⏳ IN PROGRESS
- Sprint 3-4: Main Dashboards (Weeks 3-4)
- Sprint 5-6: Advanced Dashboards (Weeks 5-6)
- Sprint 7-8: Integration Dashboards (Weeks 7-8)
- Sprint 9-10: RWA Features (Weeks 9-10)
- Sprint 11-12: Security & OAuth (Weeks 11-12)
- Sprint 13-14: Performance Testing (Weeks 13-14)
- Sprint 15-16: Regression & UAT (Weeks 15-16)

**Total Planned**: 800+ test cases across 7 test types

---

## 🔐 CREDENTIALS & ACCESS (MEMORIZED)

**⚠️ SECURITY NOTE**: All credentials are in `doc/Credentials.md`

### JIRA Access

```
Email: subbu@aurigraph.io
API Token: ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5
URL: https://aurigraphdlt.atlassian.net
Project: AV11
Issue: AV11-421
```

### Remote Server Access

```
Host: dlt.aurigraph.io
User: subbu
Password: subbuFuture@2025
SSH: ssh subbu@dlt.aurigraph.io
Port: 22 (or 2235)
```

### GitHub Repository

```
URL: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
Branch: main
```

### IAM/Keycloak (For OAuth 2.0 Integration)

```
URL: https://iam2.aurigraph.io/
Admin User: Awdadmin
Admin Password: Awd!adminUSR$2025
Realms: AWD, AurCarbonTrace, AurHydroPulse
```

---

## 💻 DEVELOPMENT WORKFLOW

### Starting Development

```bash
# 1. Navigate to project
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal

# 2. Check git status
git status
git pull origin main

# 3. Start development server (optional)
npm run dev
# Opens at http://localhost:3000

# 4. Run tests in watch mode
npm test

# 5. Check test coverage
npm run test:coverage
```

### Creating New Tests

**Pattern to follow** (see Dashboard.test.tsx):

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../utils/test-utils';
import ComponentName from '../../pages/ComponentName';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ComponentName />);
      expect(screen.getByText(/ComponentName/i)).toBeInTheDocument();
    });
  });

  // More test categories...
});
```

### Git Workflow

```bash
# Stage changes
git add <files>

# Commit with detailed message
git commit -m "test: Add Performance component tests

- Implemented 25+ test cases
- Coverage: rendering, data fetching, charts
- All tests passing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push origin main
```

### Updating JIRA

**Use this pattern**:

```bash
# Create update script
cat > /tmp/update-jira.sh << 'EOF'
#!/bin/bash
EMAIL="subbu@aurigraph.io"
TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
URL="https://aurigraphdlt.atlassian.net"
ISSUE_KEY="AV11-421"

curl -s -X POST \
  -u "${EMAIL}:${TOKEN}" \
  -H "Content-Type: application/json" \
  "${URL}/rest/api/3/issue/${ISSUE_KEY}/comment" \
  -d '{
    "body": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [{"type": "text", "text": "Your update here"}]
        }
      ]
    }
  }'
EOF

chmod +x /tmp/update-jira.sh && /tmp/update-jira.sh
```

---

## 📚 CRITICAL DOCUMENTATION

### Must-Read Documents

1. **CONTEXT.md** (this file) - Session continuity
2. **TEST_PLAN.md** (2,173 lines) - Comprehensive test strategy
3. **TEST_PLAN_SUMMARY.md** (707 lines) - Quick reference
4. **TESTING_SETUP_COMPLETE.md** (464 lines) - Infrastructure guide
5. **DEPLOYMENT_LOG.md** (425 lines) - Deployment details
6. **SESSION_SUMMARY.md** (640 lines) - Latest session recap
7. **doc/Credentials.md** - All credentials

### Quick Reference Links

**Production**:
- Portal: https://dlt.aurigraph.io
- API: https://dlt.aurigraph.io/api/v11/health

**Project Management**:
- JIRA Issue: https://aurigraphdlt.atlassian.net/browse/AV11-421
- GitHub: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- Board: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789

**Documentation**:
- Test Plan: ./TEST_PLAN.md
- Coverage Report: ./enterprise-portal/coverage/index.html (after running tests)

---

## 🎯 TODO LIST (PRIORITIZED)

### High Priority (This Week)

- [ ] **Complete Performance.test.tsx** (~25 tests)
  - Rendering, data fetching, charts
  - Real-time updates, error handling
  - TPS metrics, latency charts

- [ ] **Complete Settings.test.tsx** (~35 tests)
  - System settings CRUD
  - User management
  - Form validation
  - API integration tests

- [ ] **Run Coverage Measurement**
  ```bash
  npm run test:coverage
  ```
  - Target: 85%+ for core pages
  - Generate HTML report
  - Identify gaps

- [ ] **Update JIRA AV11-421**
  - Add coverage results
  - Document test completion
  - Link to coverage report

### Medium Priority (Next Week)

- [ ] **Set up CI/CD Pipeline**
  - Create `.github/workflows/test.yml`
  - Automate test runs on push/PR
  - Add coverage reporting (Codecov)
  - Add status badges

- [ ] **Begin Sprint 2: Main Dashboards**
  - Analytics.test.tsx
  - NodeManagement.test.tsx
  - DeveloperDashboard.test.tsx
  - RicardianContracts.test.tsx
  - SecurityAudit.test.tsx

### Low Priority (Future)

- [ ] **OAuth 2.0 Integration**
  - Keycloak connection (iam2.aurigraph.io)
  - JWT token management
  - RBAC implementation
  - Security tests

- [ ] **E2E Tests** (Cypress/Playwright)
  - Critical user journeys
  - Cross-browser testing
  - Mobile responsiveness

---

## 🔨 COMMON COMMANDS (MEMORIZED)

### Testing Commands

```bash
# Development
npm test                    # Watch mode
npm run test:ui            # Interactive UI

# CI/CD
npm run test:run           # Single run
npm run test:coverage      # Coverage report

# Coverage Analysis
npm run test:coverage
open coverage/index.html   # View HTML report
```

### Development Commands

```bash
# Start dev server
npm run dev                # Port 3000

# Build
npm run build              # Production build
npm run build:check        # TypeScript check + build

# Linting
npm run lint               # ESLint
```

### Git Commands

```bash
# Status
git status
git log --oneline -10

# Common workflow
git add -A
git commit -m "message"
git push origin main

# Pull latest
git pull origin main
```

### Remote Server Commands

```bash
# SSH access
ssh subbu@dlt.aurigraph.io

# Check service
curl https://dlt.aurigraph.io/api/v11/health

# View logs
ssh subbu@dlt.aurigraph.io "cd /opt/aurigraph-v11 && tail -50 logs/aurigraph-v11.log"
```

---

## 📊 GIT COMMIT HISTORY (RECENT)

**Last 12 Commits** (October 19, 2025):

| Commit | Description | Files |
|--------|-------------|-------|
| `0b59337e` | Session summary | 1 |
| `49c57f1e` | Test utilities + Dashboard/Transactions tests | 4 |
| `b2322d9d` | Testing setup documentation | 1 |
| `b5e2b8f9` | Test configuration (Vitest, MSW) | 7 |
| `dc587526` | Testing dependencies installed | 2 |
| `7c190518` | Test plan summary | 1 |
| `0088b62e` | Comprehensive test plan | 1 |
| `7c635e04` | Smoke test results | 1 |
| `d05d0fd2` | Production deployment | 1 |

**Total Session**: 12 commits, 8,640+ lines added

---

## 🎓 IMPORTANT PATTERNS & CONVENTIONS

### Test File Naming

```
src/__tests__/pages/ComponentName.test.tsx
```

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('Category', () => {
    it('should do something', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Test Categories (Consistent Across All Tests)

1. Rendering
2. Data Fetching
3. User Interactions
4. Real-time Updates
5. Error Handling
6. Accessibility
7. State Management
8. (Component-specific categories)

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types**: test, feat, fix, docs, refactor, style, chore

**Footer**: Always include Claude Code attribution

---

## ⚠️ KNOWN ISSUES & NOTES

### Testing Notes

1. **MSW Handlers**: All configured in `src/mocks/handlers.ts`
2. **Coverage Threshold**: 85% enforced - tests will fail if below
3. **Vitest vs Jest**: Using Vitest (faster, Vite-native)
4. **Path Aliases**: Configured in vitest.config.ts

### Deployment Notes

1. **Production URL**: https://dlt.aurigraph.io
2. **Backend Port**: 9003
3. **Some APIs**: Return 404 (V11 migration ~30% complete - expected)
4. **SSL Certificate**: Self-signed (development)

### Development Notes

1. **Node Version**: 20+
2. **Package Manager**: npm
3. **Port Conflicts**: Vite dev server on 3000
4. **Hot Reload**: Enabled for both app and tests

---

## 🚀 QUICK RECOVERY CHECKLIST

**When resuming work, do this in order**:

1. ✅ **Read CONTEXT.md** (this file) - 5 min
2. ✅ **Read SESSION_SUMMARY.md** - Last session recap - 3 min
3. ✅ **Check JIRA AV11-421** - Current status - 2 min
4. ✅ **Pull latest from GitHub**
   ```bash
   cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT
   git pull origin main
   ```
5. ✅ **Review TODO list** (see above) - 2 min
6. ✅ **Navigate to project**
   ```bash
   cd aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal
   ```
7. ✅ **Run tests to verify setup**
   ```bash
   npm test
   ```
8. ✅ **Start working** on highest priority task

**Total Time**: ~15 minutes to full context restoration

---

## 📞 SUPPORT & RESOURCES

### Documentation Resources

- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro
- **Vitest**: https://vitest.dev/
- **MSW**: https://mswjs.io/docs/
- **Material-UI**: https://mui.com/material-ui/getting-started/

### Internal Documentation

- CLAUDE.md - Main project guidance
- TEST_PLAN.md - Testing strategy
- DEPLOYMENT_LOG.md - Deployment procedures
- doc/Credentials.md - All credentials

---

## 🔄 CONTEXT UPDATE PROTOCOL

**When to update this file**:
- ✅ After major milestones
- ✅ When project status changes
- ✅ When new tests are implemented
- ✅ When configuration changes
- ✅ At end of each work session

**How to update**:
1. Edit CONTEXT.md
2. Update "Last Updated" date
3. Update "Current Status" section
4. Update "Current Progress" section
5. Update "TODO List"
6. Commit changes:
   ```bash
   git add CONTEXT.md
   git commit -m "docs: Update CONTEXT.md - [brief description of changes]"
   git push origin main
   ```

---

## 📌 IMPORTANT REMINDERS

### Always Remember

1. **Read CONTEXT.md first** when resuming work
2. **Update JIRA** after significant progress
3. **Run tests** before committing
4. **Check coverage** regularly
5. **Document** new patterns or issues
6. **Commit frequently** with clear messages
7. **Push to GitHub** at end of session

### Never Forget

1. Credentials are in `doc/Credentials.md`
2. JIRA token expires (check if API calls fail)
3. MSW mocks need updates when APIs change
4. Coverage threshold is 85% (enforced)
5. Production is LIVE - test changes carefully

---

## ✅ SESSION CHECKLIST

**At End of Each Session**:

- [ ] All tests passing (`npm test`)
- [ ] Changes committed to Git
- [ ] Changes pushed to GitHub
- [ ] JIRA updated with progress
- [ ] CONTEXT.md updated with latest status
- [ ] TODO list updated
- [ ] Session summary created (optional for major sessions)

---

## 🎯 SUCCESS METRICS

### Current Metrics (As of October 19, 2025)

**Production**:
- ✅ Portal: LIVE and operational
- ✅ Response Time: 58ms
- ✅ Pages: 23/23 deployed
- ✅ Smoke Tests: 13/19 passed

**Testing**:
- ⏳ Unit Tests: 70/130 implemented (Sprint 1)
- ⏳ Coverage: Pending measurement (target 85%+)
- ✅ Infrastructure: 100% complete
- ✅ Test Plan: 100% documented

**Documentation**:
- ✅ 4,400+ lines created
- ✅ 5 major documents
- ✅ 100% of infrastructure documented

**Git Activity**:
- ✅ 12 commits in last session
- ✅ 8,640+ lines added
- ✅ All work version controlled

---

## 🌟 FINAL NOTES

This CONTEXT.md file is the **single source of truth** for session continuity.

**When starting a new session**:
1. Read this file completely (15 minutes)
2. Execute "Quick Recovery Checklist"
3. Check JIRA for any external updates
4. Begin with highest priority TODO item

**When this file is outdated**:
- Update immediately
- Commit changes
- Consider it critical maintenance

**This file should be the first thing you read and the last thing you update.**

---

**Last Updated**: October 19, 2025
**Next Review**: At start of next session
**Status**: ✅ COMPLETE AND READY FOR USE

---

*End of CONTEXT.md*

**🔖 Bookmark this file - it's your session lifeline!**
