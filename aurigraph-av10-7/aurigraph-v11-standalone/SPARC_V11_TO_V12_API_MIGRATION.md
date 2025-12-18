# SPARC/Sprint/Test Plan: V11 to V12 API Migration

**Project**: Aurigraph DLT Platform
**Date**: December 18, 2025
**Version**: 1.0.0
**Status**: Active

---

## SPARC Framework

### S - Situation

**Current State**:
- Enterprise Portal frontend has ~100+ files referencing `/api/v11/*` endpoints
- Backend has evolved to V12 with PortalAPIGateway handling `/api/v12/*` routes
- V11 endpoints are deprecated and many return 500 errors ("Unable to find matching target resource method")
- Console errors affect user experience on tokenization dashboard

**Systems Affected**:
- Frontend: `enterprise-portal/src/` - React/TypeScript components and services
- Backend: `src/main/java/io/aurigraph/v11/` - Quarkus REST endpoints
- API Gateway: `PortalAPIGateway.java` - Routes `/api/v12/*` requests

**Stakeholders**:
- Development Team
- Operations Team
- End Users (Demo tokenization dashboard users)

### P - Problem

**Core Issues**:
1. API version mismatch between frontend (v11) and backend (v12)
2. V11 endpoints not registered/working in current deployment
3. Console errors degrading user experience
4. Technical debt from maintaining two API versions
5. Demo tokenization features failing due to 400/500 API responses

**Root Cause**:
- Backend evolved to V12 API structure with PortalAPIGateway
- Frontend was never updated to match
- V11 endpoints in ChannelResource, RWAApiResource are shadowed by PortalAPIGateway

**Impact**:
- Demo tokenization dashboard non-functional
- Channels API returns 500 errors
- RWA registry, tokens, and asset endpoints fail
- User trust and product credibility affected

### A - Action Plan

#### Sprint Structure (3-Day Sprint)

**Day 1: Discovery & Backend Alignment**
- [ ] Audit all V11 backend endpoints (active vs disabled)
- [ ] Verify V12 endpoint coverage for all V11 functionality
- [ ] Identify any V11 endpoints needing V12 equivalents
- [ ] Update/create V12 endpoints if gaps exist

**Day 2: Frontend Migration**
- [ ] Update all service layer API calls (contractsApi.ts, phase2Api.ts, DemoService.ts)
- [ ] Update all component API calls (ConsensusStateMonitor, Performance, Transactions)
- [ ] Update page-level API calls (dashboards, visualizers)
- [ ] Update WebSocket endpoints if applicable

**Day 3: Testing & Deployment**
- [ ] Run frontend build verification
- [ ] Run backend build verification
- [ ] Deploy to remote server
- [ ] Execute smoke tests
- [ ] Execute E2E tests
- [ ] Document migration completion

### R - Result (Expected Outcomes)

**Success Metrics**:
- Zero console errors on demo tokenization dashboard
- All API endpoints return 2xx responses
- Demo creation/management fully functional
- Build passes without TypeScript/Java errors
- E2E tests pass (151 total: 76 Playwright + 75 Pytest)

**Deliverables**:
1. Updated frontend with V12 API calls only
2. Deprecated V11 redirect endpoints (for backward compatibility)
3. Updated documentation
4. Passing test suite
5. Clean production deployment

### C - Consequence

**If Migration Succeeds**:
- Clean codebase with single API version
- Reduced maintenance burden
- Better user experience
- Foundation for future V12 enhancements

**If Migration Fails**:
- Rollback to previous commit
- Debug and fix specific failures
- Re-attempt with lessons learned

**Risk Mitigation**:
- Git branch strategy for easy rollback
- Incremental commits for granular rollback points
- Smoke tests at each deployment stage

---

## Sprint Execution Plan

### Sprint Backlog

| ID | Task | Priority | Effort | Status |
|----|------|----------|--------|--------|
| M-001 | Audit V11 backend endpoints | P0 | 1h | Pending |
| M-002 | Verify V12 endpoint coverage | P0 | 1h | Pending |
| M-003 | Update contractsApi.ts (12+ refs) | P0 | 30m | Pending |
| M-004 | Update phase2Api.ts (40+ refs) | P0 | 1h | Pending |
| M-005 | Update DemoService.ts | P0 | 15m | Pending |
| M-006 | Update ChannelService.ts | P0 | 15m | Done |
| M-007 | Update RWATokenizationDashboard.tsx | P0 | 30m | Done |
| M-008 | Update ConsensusStateMonitor.tsx | P1 | 30m | Pending |
| M-009 | Update Performance.tsx | P1 | 15m | Pending |
| M-010 | Update Transactions.tsx | P1 | 15m | Pending |
| M-011 | Update NetworkTopologyVisualizer.tsx | P1 | 15m | Pending |
| M-012 | Update remaining component files | P1 | 2h | Pending |
| M-013 | Run frontend build | P0 | 10m | Pending |
| M-014 | Run backend build | P0 | 5m | Pending |
| M-015 | Deploy to remote server | P0 | 15m | Pending |
| M-016 | Run smoke tests | P0 | 10m | Pending |
| M-017 | Run E2E test suite | P1 | 30m | Pending |
| M-018 | Update documentation | P2 | 30m | Pending |

### File Migration Checklist

#### Services Layer (Priority 0)
- [ ] `src/services/contractsApi.ts` - 12+ v11 references
- [ ] `src/services/phase2Api.ts` - 40+ v11 references
- [ ] `src/services/DemoService.ts` - Demo API calls
- [x] `src/services/ChannelService.ts` - Updated

#### Components Layer (Priority 1)
- [ ] `src/components/ConsensusStateMonitor.tsx` - 10+ v11 references
- [ ] `src/components/Performance.tsx`
- [ ] `src/components/Transactions.tsx`
- [ ] `src/components/NetworkTopologyVisualizer.tsx`
- [ ] `src/components/BlockchainOperationsMonitor.tsx`
- [ ] `src/components/VisualizationDashboard.tsx`

#### Pages Layer (Priority 1)
- [x] `src/pages/rwa/RWATokenizationDashboard.tsx` - Updated
- [ ] `src/pages/rwa/TokenizeAsset.tsx`
- [ ] `src/pages/LiveDemo.tsx`
- [ ] Other page files with v11 references

---

## Test Plan

### Unit Tests
- Verify API service functions call correct V12 endpoints
- Mock responses for V12 endpoint structure

### Integration Tests
- Test frontend-backend integration with V12 endpoints
- Verify CORS and authentication work with V12

### E2E Tests
- **Playwright Suite (76 tests)**:
  - Demo creation flow
  - Tokenization dashboard
  - Channel management
  - RWA asset operations

- **Pytest Suite (75 tests)**:
  - Backend API endpoint tests
  - Demo CRUD operations
  - Channel operations
  - RWA operations

### Smoke Test Suite
```bash
# Post-deployment verification
# 1. Demo API
curl -X GET https://dlt.aurigraph.io/api/v11/demos -H "Content-Type: application/json"

# 2. Channels API (V12)
curl -X GET https://dlt.aurigraph.io/api/v12/channels -H "Content-Type: application/json"

# 3. RWA Assets (V12)
curl -X GET https://dlt.aurigraph.io/api/v12/rwa/assets -H "Content-Type: application/json"

# 4. Health Check
curl -X GET https://dlt.aurigraph.io/api/v12/portal/status

# 5. Network Status
curl -X GET https://dlt.aurigraph.io/api/v12/network/status
```

### Acceptance Criteria
- [ ] All API calls use V12 endpoints (except Demo which stays v11 for now)
- [ ] No console errors on dashboard pages
- [ ] Demo tokenization workflow functional
- [ ] Build succeeds without errors
- [ ] Smoke tests pass (100%)
- [ ] E2E tests pass (>95%)

---

## Rollback Plan

### Pre-Migration
```bash
# Create rollback point
git checkout V12
git pull origin V12
git checkout -b V12-pre-migration-backup
```

### If Migration Fails
```bash
# Quick rollback
git checkout V12
git reset --hard V12-pre-migration-backup
git push origin V12 --force

# Or revert specific commits
git revert <commit-hash>
```

---

## Execution Log

| Date | Time | Action | Result | Notes |
|------|------|--------|--------|-------|
| 2025-12-18 | 06:30 | Created SPARC plan | Success | Initial version |
| 2025-12-18 | 06:35 | Updated api.ts baseURL | Success | v11→v12 |
| 2025-12-18 | 06:36 | Updated phase2Api.ts | Success | 40+ references |
| 2025-12-18 | 06:37 | Updated contractsApi.ts | Success | 12+ references |
| 2025-12-18 | 06:38 | Updated all components | Success | 45+ files via sed |
| 2025-12-18 | 06:40 | Frontend build | Success | 4.52s, no errors |
| 2025-12-18 | 06:42 | Backend build | Success | No errors |
| 2025-12-18 | 06:45 | Git commit & push | Success | 42 files changed |
| 2025-12-18 | 06:49 | Smoke tests (frontend) | Pass | V12 Channels API working |
| 2025-12-18 | 07:00 | Backend V11→V12 migration | Success | DemoResource, PerformanceBenchmark, WebSocketTest |
| 2025-12-18 | 07:02 | Removed V11 aliases | Success | ChannelResource, RWAApiResource |
| 2025-12-18 | 07:03 | Created V11→V12 redirect | Success | DemoV11RedirectResource |
| 2025-12-18 | 07:04 | Backend build | Success | All changes compile |
| 2025-12-18 | 07:05 | Push & deploy trigger | Success | CI/CD running |

---

## Notes

### V11 Endpoints to Keep
- `/api/v11/demos` - Demo management (Redis-backed, working)
- V11 redirect endpoints for backward compatibility

### V12 Endpoints (Primary)
- `/api/v12/channels` - Channel management
- `/api/v12/rwa/*` - RWA tokenization
- `/api/v12/network/*` - Network status
- `/api/v12/portal/*` - Portal gateway
- All other V12 endpoints via PortalAPIGateway

---

*Document generated by Claude Code as part of V11→V12 API migration project*
