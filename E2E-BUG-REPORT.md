# E2E Testing Bug Report
**Date**: December 2, 2025
**Updated**: December 3, 2025
**Tested Environment**: https://dlt.aurigraph.io
**Branch**: V12

## Summary
- **Total Endpoints Tested**: 20+
- **Working Endpoints**: 17+
- **Critical Bugs (500 errors)**: 3 (2 path mismatch bugs FIXED)
- **Minor Issues**: 2

---

## Critical Bugs (500 Errors)

### BUG-001: Token Creation API - ANALYSIS COMPLETE
**Endpoint**: `POST /api/v11/tokens/create`
**Status**: 500 Internal Server Error → **ROOT CAUSE IDENTIFIED**
**Priority**: HIGHEST
**Files**:
- `src/main/java/io/aurigraph/v11/portal/PortalAPIGateway.java` (lines 361-375) - REST endpoint
- `src/main/java/io/aurigraph/v11/portal/services/TokenDataService.java` (lines 301-327) - Service
**Root Cause**: The `PortalAPIGateway` route uses `TokenDataService` which is **mock data only**.
The real `TokenManagementService` was disabled due to LevelDB initialization issues (line 22 of TokenDataService).
**Fix Required**: Either:
- Re-enable `TokenManagementService` injection in `TokenDataService` after fixing LevelDB
- OR ensure LevelDB is properly initialized in production

### BUG-002: Login API - DATABASE DEPENDENCY
**Endpoint**: `POST /api/v11/auth/login` (actual: `/api/v11/login/authenticate`)
**Status**: 500 Internal Server Error → **ROOT CAUSE IDENTIFIED**
**Priority**: HIGHEST
**File**: `src/main/java/io/aurigraph/v11/auth/LoginResource.java` (lines 29-139)
**Root Cause**: Uses Panache ORM (`User.findByUsername()`) which requires PostgreSQL.
Production database: `jdbc:postgresql://dlt-postgres:5432/aurigraph_production`
**Fix Required**: Ensure PostgreSQL container `dlt-postgres` is running and accessible.

### BUG-003: Demo Registration API - DATABASE DEPENDENCY
**Endpoint**: `POST /api/v11/demos` (not `/demos/register`)
**Status**: 500 Internal Server Error → **ROOT CAUSE IDENTIFIED**
**Priority**: HIGH
**File**: `src/main/java/io/aurigraph/v11/demo/api/DemoResource.java` (lines 68-120)
**Root Cause**: Uses `@Transactional` + Panache ORM which requires PostgreSQL.
The `Demo.persist()` call fails without database connectivity.
**Fix Required**: Ensure PostgreSQL container `dlt-postgres` is running and accessible.

### ~~BUG-004: Blockchain Search API - PATH MISMATCH~~ FIXED
**Endpoint Called**: `GET /api/v11/blockchain/search`
**Actual Endpoint**: `GET /api/v11/blockchain/blocks/search`
**Status**: ~~500~~ **FIXED** - Alias endpoint added at line 122-138
**Priority**: ~~MEDIUM~~ RESOLVED
**File**: `src/main/java/io/aurigraph/v11/api/BlockchainSearchApiResource.java`
**Resolution**: Added `/search` endpoint alias that delegates to `/blocks/search`

### ~~BUG-005: Network Analytics API - PATH MISMATCH~~ FIXED
**Endpoint Called**: `GET /api/v11/analytics/network`
**Actual Endpoint**: `GET /api/v11/analytics/network-usage`
**Status**: ~~500~~ **FIXED** - Alias endpoint added at line 38-49
**Priority**: ~~MEDIUM~~ RESOLVED
**File**: `src/main/java/io/aurigraph/v11/api/Phase2ComprehensiveApiResource.java`
**Resolution**: Added `/analytics/network` endpoint alias that delegates to `/network-usage`

---

## Minor Issues

### ISSUE-001: Expired Demo Sessions
**Observation**: Some demo data shows expired timestamps
**Impact**: Low - cosmetic issue

### ISSUE-002: Bridge Transfers Stuck
**Observation**: Cross-chain transfers show "pending" status indefinitely
**Impact**: Medium - affects cross-chain demo functionality

---

## Working Endpoints (Verified)

| Endpoint | Status | Response Time |
|----------|--------|---------------|
| GET /api/v11/health | 200 OK | <50ms |
| GET /api/v11/info | 200 OK | <50ms |
| GET /api/v11/stats | 200 OK | <100ms |
| GET /api/v11/analytics/dashboard | 200 OK | <200ms |
| GET /api/v11/blockchain/transactions | 200 OK | <150ms |
| GET /api/v11/nodes | 200 OK | <100ms |
| GET /api/v11/consensus/status | 200 OK | <100ms |
| GET /api/v11/demos | 200 OK | <100ms |
| GET /api/v11/contracts | 200 OK | <100ms |
| GET /api/v11/rwa/assets | 200 OK | <100ms |
| GET /api/v11/channels | 200 OK | <100ms |
| GET /api/v11/validators | 200 OK | <100ms |
| GET /api/v11/staking/info | 200 OK | <100ms |
| GET /api/v11/bridge/status | 200 OK | <100ms |
| GET /api/v11/tokens | 200 OK | <100ms |

---

## Recommended Fix Order

1. ~~**BUG-004 & BUG-005** (Path Mismatches) - Quick wins~~ ✅ FIXED (aliases already exist)
2. **Infrastructure Fix**: Ensure `dlt-postgres` PostgreSQL container is running
   - This fixes BUG-002 (Login) and BUG-003 (Demo Registration)
3. **BUG-001** (Token Creation) - Re-enable TokenManagementService after fixing LevelDB

## Root Cause Summary

All remaining bugs are **infrastructure/database related**:
- PostgreSQL container `dlt-postgres` must be running on port 5432
- LevelDB paths must be writable (`/var/lib/aurigraph/leveldb/`)
- Production config expects: `jdbc:postgresql://dlt-postgres:5432/aurigraph_production`

---

## Notes
- JIRA ticket creation failed due to API permission issues
- AV11-553 was successfully created earlier for Token Creation bug
- All bugs documented here for manual JIRA entry if needed
