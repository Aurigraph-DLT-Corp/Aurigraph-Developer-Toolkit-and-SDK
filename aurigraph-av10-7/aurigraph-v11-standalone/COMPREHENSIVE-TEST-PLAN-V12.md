# Aurigraph V12 Comprehensive Test Plan

**Version**: 12.0.0
**Created**: December 11, 2025
**Author**: J4C Development Agent
**JIRA Project**: AV11
**Target Coverage**: 95%

---

## 1. Executive Summary

This comprehensive test plan covers all testing requirements for the Aurigraph V12 platform, including Smoke Tests, Regression Tests, and detailed test cases following industry best practices (ISO 29119, ISTQB guidelines).

### 1.1 Test Suite Overview

| Test Type | Framework | Test Count | Priority |
|-----------|-----------|------------|----------|
| Smoke Tests | Playwright/Pytest | 37 | P0 - Critical |
| Regression Tests | Playwright/Pytest | 115+ | P1 - High |
| Unit Tests | JUnit 5 | 200+ | P1 - High |
| Integration Tests | TestContainers | 50+ | P2 - Medium |
| E2E Tests | Playwright | 76 | P1 - High |
| Performance Tests | JMeter/Gatling | 30 | P2 - Medium |
| Security Tests | OWASP ZAP | 25 | P1 - High |
| CDN/Storage Tests | MinIO/Nginx | 12 | P1 - High |

---

## 2. Smoke Test Suite (P0 - Critical Path)

Execute after every deployment. **Must pass 100%** before proceeding.

### 2.1 Backend API Smoke Tests

| ID | Test Case | Endpoint | Expected Result | Timeout |
|----|-----------|----------|-----------------|---------|
| SMK-001 | Health Check | GET /api/v11/health | 200 OK, status: "UP" | 5s |
| SMK-002 | System Info | GET /api/v11/info | 200 OK, version data | 5s |
| SMK-003 | Token Categories | GET /api/v11/tokens/categories | 200 OK, 12 categories | 5s |
| SMK-004 | User List | GET /api/v11/users | 200 OK, array response | 10s |
| SMK-005 | Contracts List | GET /api/v11/contracts/smart | 200 OK, array response | 10s |
| SMK-006 | Assets List | GET /api/v11/assets | 200 OK, array response | 10s |
| SMK-007 | Verification Services | GET /api/v11/verification/services | 200 OK, services map | 5s |
| SMK-008 | Database Connection | Internal health check | DB connected | 5s |

### 2.2 Frontend Smoke Tests

| ID | Test Case | Page | Expected Result | Timeout |
|----|-----------|------|-----------------|---------|
| SMK-F01 | Dashboard Load | /dashboard | Page renders, no console errors | 10s |
| SMK-F02 | Navigation Menu | Header | All nav items visible | 5s |
| SMK-F03 | Login Page | /login | Form renders, submit works | 10s |
| SMK-F04 | Token List | /tokens | Table/list renders | 15s |
| SMK-F05 | Contract Page | /contracts | Content loads | 15s |

### 2.3 Infrastructure Smoke Tests

| ID | Test Case | Component | Expected Result |
|----|-----------|-----------|-----------------|
| SMK-I01 | Docker Health | All containers | Status: healthy |
| SMK-I02 | Nginx Proxy | Load balancer | 200 OK from external URL |
| SMK-I03 | Database | PostgreSQL | Connection success |
| SMK-I04 | Redis Cache | Redis | PONG response |
| SMK-I05 | Certificate | SSL/TLS | Valid, not expired |

### 2.4 MinIO CDN Smoke Tests

| ID | Test Case | Component | Expected Result |
|----|-----------|-----------|-----------------|
| SMK-CDN01 | MinIO Health | MinIO container | Status: healthy, API accessible |
| SMK-CDN02 | Bucket Access | attachments bucket | Bucket exists, readable |
| SMK-CDN03 | Bucket Access | documents bucket | Bucket exists, readable |
| SMK-CDN04 | Bucket Access | assets bucket | Bucket exists, readable |
| SMK-CDN05 | CDN Proxy | Nginx /cdn/* | 200 OK from https://dlt.aurigraph.io/cdn/ |
| SMK-CDN06 | File Upload | POST to MinIO | File uploaded, SHA256 hash returned |
| SMK-CDN07 | CDN URL Access | GET cdn_url | File accessible via CDN URL |

### 2.5 File Attachment Smoke Tests

| ID | Test Case | Endpoint | Expected Result | Timeout |
|----|-----------|----------|-----------------|---------|
| SMK-FA01 | Upload File | POST /api/v11/attachments/upload | 201 Created, fileId + cdnUrl returned | 30s |
| SMK-FA02 | Get Attachment | GET /api/v11/attachments/{fileId} | 200 OK, file metadata | 5s |
| SMK-FA03 | List by Token | GET /api/v11/attachments/token/{tokenId} | 200 OK, array of attachments | 10s |
| SMK-FA04 | Verify Hash | POST /api/v11/attachments/{fileId}/verify | 200 OK, verified: true | 10s |
| SMK-FA05 | Download File | GET /api/v11/attachments/{fileId}/download | 200 OK, file content | 30s |

---

## 3. Regression Test Buckets

### 3.1 Bucket A: Core API Regression (50 tests)

#### A.1 User Management (10 tests)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| REG-A01 | Create User | POST /api/v11/users with valid data | 201 Created, user ID returned |
| REG-A02 | Get User by ID | GET /api/v11/users/{id} | 200 OK, correct user data |
| REG-A03 | Update User | PUT /api/v11/users/{id} | 200 OK, updated data |
| REG-A04 | Delete User | DELETE /api/v11/users/{id} | 204 No Content |
| REG-A05 | List Users Paginated | GET /api/v11/users?page=1&size=10 | Paginated response |
| REG-A06 | Search Users | GET /api/v11/users?search=john | Filtered results |
| REG-A07 | User KYC Status | GET /api/v11/users/{id}/kyc | KYC verification status |
| REG-A08 | Invalid User ID | GET /api/v11/users/invalid-uuid | 400 Bad Request |
| REG-A09 | Duplicate Email | POST /api/v11/users (dup email) | 409 Conflict |
| REG-A10 | User Profile Update | PATCH /api/v11/users/{id}/profile | 200 OK |

#### A.2 Token Management (15 tests)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| REG-A11 | List All Tokens | GET /api/v11/tokens | 200 OK, array |
| REG-A12 | Create Token | POST /api/v11/tokens | 201 Created |
| REG-A13 | Get Token Details | GET /api/v11/tokens/{id} | 200 OK, token data |
| REG-A14 | Update Token | PUT /api/v11/tokens/{id} | 200 OK |
| REG-A15 | Token Categories | GET /api/v11/tokens/categories | 12 categories |
| REG-A16 | Token by Category | GET /api/v11/tokens?category=REAL_ESTATE | Filtered tokens |
| REG-A17 | Token Valuation | GET /api/v11/tokens/{id}/valuation | Valuation data |
| REG-A18 | Token Transfer | POST /api/v11/tokens/{id}/transfer | Transfer initiated |
| REG-A19 | Token History | GET /api/v11/tokens/{id}/history | Transaction history |
| REG-A20 | Mint Tokens | POST /api/v11/tokens/{id}/mint | Tokens minted |
| REG-A21 | Burn Tokens | POST /api/v11/tokens/{id}/burn | Tokens burned |
| REG-A22 | Token Holders | GET /api/v11/tokens/{id}/holders | Holder list |
| REG-A23 | Token Metadata | GET /api/v11/tokens/{id}/metadata | IPFS metadata |
| REG-A24 | Token Compliance | GET /api/v11/tokens/{id}/compliance | Compliance status |
| REG-A25 | Invalid Token | GET /api/v11/tokens/invalid | 404 Not Found |

#### A.3 Contract Management (15 tests)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| REG-A26 | List Smart Contracts | GET /api/v11/contracts/smart | Contract list |
| REG-A27 | List Legal Contracts | GET /api/v11/contracts/legal | Legal templates |
| REG-A28 | Create Contract | POST /api/v11/contracts/smart | 201 Created |
| REG-A29 | Deploy Contract | POST /api/v11/contracts/{id}/deploy | Deployment started |
| REG-A30 | Contract Status | GET /api/v11/contracts/{id}/status | Status info |
| REG-A31 | Contract ABI | GET /api/v11/contracts/{id}/abi | ABI JSON |
| REG-A32 | Contract Events | GET /api/v11/contracts/{id}/events | Event logs |
| REG-A33 | Execute Contract | POST /api/v11/contracts/{id}/execute | Execution result |
| REG-A34 | Contract Variables | GET /api/v11/contracts/{id}/state | State variables |
| REG-A35 | Pause Contract | POST /api/v11/contracts/{id}/pause | Contract paused |
| REG-A36 | Resume Contract | POST /api/v11/contracts/{id}/resume | Contract resumed |
| REG-A37 | Contract Upgrade | POST /api/v11/contracts/{id}/upgrade | Upgrade initiated |
| REG-A38 | Contract Verify | POST /api/v11/contracts/{id}/verify | Source verified |
| REG-A39 | Contract Gas Est | POST /api/v11/contracts/{id}/gas | Gas estimate |
| REG-A40 | Invalid Contract | GET /api/v11/contracts/invalid | 404 Not Found |

#### A.4 Asset Registry (10 tests)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| REG-A41 | Register Asset | POST /api/v11/assets | 201 Created |
| REG-A42 | Get Asset | GET /api/v11/assets/{id} | Asset details |
| REG-A43 | Update Asset | PUT /api/v11/assets/{id} | Updated asset |
| REG-A44 | Asset Verification | POST /api/v11/assets/{id}/verify | Verification started |
| REG-A45 | Asset Categories | GET /api/v11/assets/categories | 12 categories |
| REG-A46 | Asset by Status | GET /api/v11/assets?status=VERIFIED | Filtered assets |
| REG-A47 | Asset Valuation | PUT /api/v11/assets/{id}/valuation | Valuation updated |
| REG-A48 | Asset Documents | GET /api/v11/assets/{id}/documents | Document list |
| REG-A49 | Tokenize Asset | POST /api/v11/assets/{id}/tokenize | Tokenization started |
| REG-A50 | Delete Asset | DELETE /api/v11/assets/{id} | 204 No Content |

#### A.5 File Attachments & CDN (15 tests)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| REG-A51 | Upload Document | POST /api/v11/attachments/upload (PDF) | 201, fileId + cdnUrl returned |
| REG-A52 | Upload Image | POST /api/v11/attachments/upload (PNG) | 201, mime type detected |
| REG-A53 | Get Attachment | GET /api/v11/attachments/{fileId} | 200, full metadata |
| REG-A54 | List by Token | GET /api/v11/attachments/token/{id} | 200, array of files |
| REG-A55 | List by Transaction | GET /api/v11/attachments/tx/{txId} | 200, array of files |
| REG-A56 | List by Category | GET /api/v11/attachments?category=documents | 200, filtered results |
| REG-A57 | Verify Hash | POST /api/v11/attachments/{fileId}/verify | 200, verified: true |
| REG-A58 | Invalid Hash | POST with wrong sha256 | 400, hash mismatch error |
| REG-A59 | Link to Token | PUT /api/v11/attachments/{fileId}/link/token/{id} | 200, linked |
| REG-A60 | Link to Transaction | PUT /api/v11/attachments/{fileId}/link/tx/{id} | 200, linked |
| REG-A61 | Download File | GET /api/v11/attachments/{fileId}/download | 200, file content |
| REG-A62 | CDN URL Access | GET {cdnUrl} directly | 200, file accessible |
| REG-A63 | Soft Delete | DELETE /api/v11/attachments/{fileId} | 204, soft deleted |
| REG-A64 | Duplicate Upload | POST same file twice | 200, returns existing fileId |
| REG-A65 | Large File | POST 50MB file | 201, chunked upload |

### 3.2 Bucket B: External Verification Regression (25 tests)

| ID | Test Case | Verification Type | Expected Result |
|----|-----------|-------------------|-----------------|
| REG-B01 | KYC Basic | KYC Level BASIC | Confidence 0.70 |
| REG-B02 | KYC Standard | KYC Level STANDARD | Confidence 0.85 |
| REG-B03 | KYC Enhanced | KYC Level ENHANCED | Confidence 0.95 |
| REG-B04 | KYC Missing User | No userId | Error response |
| REG-B05 | VVB Verra | Registry: VERRA | Verified status |
| REG-B06 | VVB Gold Standard | Registry: GOLD_STANDARD | Verified status |
| REG-B07 | VVB CAR | Registry: CAR | Verified status |
| REG-B08 | VVB ACR | Registry: ACR | Verified status |
| REG-B09 | VVB Missing Project | No projectId | Error response |
| REG-B10 | Land Registry | Jurisdiction lookup | Property verified |
| REG-B11 | Land Registry Invalid | Invalid propertyId | Rejected |
| REG-B12 | Manual Bypass | With reason | Manual approval |
| REG-B13 | Manual No Reason | Without reason | Error |
| REG-B14 | Multiple Verification | All types | Multiple results |
| REG-B15 | Verification Fallback | Primary fails | Manual fallback |
| REG-B16 | Verification Services | List available | Service map |
| REG-B17 | Types by Category | REAL_ESTATE | LAND_REGISTRY, KYC |
| REG-B18 | Types by Category | CARBON_CREDITS | VVB, KYC |
| REG-B19 | Demo Mode KYC | demo=true | Demo response |
| REG-B20 | Demo Mode VVB | demo=true | Demo response |
| REG-B21 | IP Registry | IP verification | Status returned |
| REG-B22 | SEC Filing | SEC verification | Status returned |
| REG-B23 | Bulk Approval | Multiple assets | All approved |
| REG-B24 | Quick Check | Existing KYC | Quick status |
| REG-B25 | Full Verification | Document flow | Full result |

### 3.3 Bucket C: Frontend E2E Regression (30 tests)

| ID | Test Case | Page/Flow | Assertions |
|----|-----------|-----------|------------|
| REG-C01 | Dashboard Metrics | /dashboard | Metrics cards visible |
| REG-C02 | Dashboard Charts | /dashboard | Charts rendered |
| REG-C03 | Navigation Flow | All pages | All links work |
| REG-C04 | Token Listing | /tokens | Table populated |
| REG-C05 | Token Search | /tokens | Search filters |
| REG-C06 | Token Create | /tokens/create | Form submits |
| REG-C07 | Contract Listing | /contracts | Table populated |
| REG-C08 | Contract Deploy | /contracts/deploy | Wizard works |
| REG-C09 | Asset Registration | /assets/register | Form flow |
| REG-C10 | Asset Tokenization | /assets/{id}/tokenize | Tokenize flow |
| REG-C11 | User Profile | /profile | Profile editable |
| REG-C12 | Settings Page | /settings | Settings work |
| REG-C13 | Notifications | Notification bell | Notifs visible |
| REG-C14 | Dark Mode | Theme toggle | Theme changes |
| REG-C15 | Mobile View | 375px width | Responsive layout |
| REG-C16 | Login Flow | /login | Auth works |
| REG-C17 | Logout Flow | Logout button | Session cleared |
| REG-C18 | Error Handling | 404 page | Error page shown |
| REG-C19 | Loading States | All pages | Skeletons shown |
| REG-C20 | Form Validation | All forms | Validation works |
| REG-C21 | File Upload | Document upload | Files uploaded |
| REG-C22 | Data Export | Export button | CSV downloaded |
| REG-C23 | Pagination | Lists | Pages work |
| REG-C24 | Sorting | Tables | Sort works |
| REG-C25 | Filtering | Tables | Filters work |
| REG-C26 | Keyboard Nav | Tab key | Focus visible |
| REG-C27 | Screen Reader | All pages | ARIA labels |
| REG-C28 | Network Error | API down | Error message |
| REG-C29 | Session Timeout | Expired token | Redirect login |
| REG-C30 | Concurrent Edits | Same resource | Conflict handling |

---

## 4. Detailed Test Cases

### 4.1 TC-001: Complete Asset Tokenization Flow

**Priority**: P0 - Critical
**Type**: End-to-End
**Estimated Duration**: 5 minutes

#### Preconditions
1. User authenticated with KYC verified status
2. Test asset data prepared
3. Database clean state

#### Test Steps

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to /assets/register | Registration form displayed | |
| 2 | Fill required fields: name, category, description | Form validates successfully | |
| 3 | Upload supporting documents (PDF, images) | Files uploaded, SHA256 hash generated | |
| 4 | Submit registration | Asset created with DRAFT status | |
| 5 | Click "Request Verification" | Verification modal opens | |
| 6 | Select verification type (LAND_REGISTRY) | Verification initiated | |
| 7 | Verify demo mode returns success | Status: VERIFIED, confidence > 0.8 | |
| 8 | Click "Tokenize Asset" | Tokenization wizard opens | |
| 9 | Configure token: supply, decimals, name | Settings validated | |
| 10 | Review and confirm tokenization | Token created, linked to asset | |
| 11 | Verify token in /tokens list | Token visible with correct metadata | |

#### Postconditions
- Asset status: TOKENIZED
- Token exists with correct supply
- All events logged

### 4.2 TC-002: KYC Verification Multi-Level

**Priority**: P1 - High
**Type**: API Integration

#### Test Data
```json
{
  "userId": "test-user-001",
  "levels": ["BASIC", "STANDARD", "ENHANCED"],
  "documents": {
    "type": "PASSPORT",
    "number": "AB1234567"
  }
}
```

#### Test Matrix

| Level | Document Required | Liveness | Address | Expected Confidence |
|-------|-------------------|----------|---------|---------------------|
| BASIC | No | No | No | 0.70 |
| STANDARD | Yes | No | No | 0.85 |
| ENHANCED | Yes | Yes | Yes | 0.95 |

### 4.3 TC-003: Carbon Credit VVB Verification

**Priority**: P1 - High
**Type**: API Integration

#### Test Scenarios

| Registry | Project ID Format | Expected Response |
|----------|-------------------|-------------------|
| VERRA | VCS-XXXX | Registry ID: VCS-*, methodology, vintage |
| GOLD_STANDARD | GS-XXXX | SDG contributions, buffer pool |
| CAR | CAR-XXXX | Project type, additionality |
| ACR | ACR-XXXX | Leakage assessment, permanence |

### 4.4 TC-004: File Upload with MinIO CDN Flow

**Priority**: P0 - Critical
**Type**: End-to-End
**Estimated Duration**: 3 minutes

#### Preconditions
1. MinIO CDN container healthy
2. Nginx CDN proxy configured
3. V17 migration applied (cdn_url column exists)

#### Test Steps

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to /assets/register or /tokenize | File upload component visible | |
| 2 | Select file (PDF, max 50MB) | File selected, client-side SHA256 computed | |
| 3 | Verify SHA256 display | Hash displayed in UI before upload | |
| 4 | Click "Upload" | POST /api/v11/attachments/upload | |
| 5 | Verify response | 201 Created, fileId + cdnUrl returned | |
| 6 | Verify cdnUrl format | URL matches https://dlt.aurigraph.io/cdn/attachments/{hash}_{filename} | |
| 7 | Access cdnUrl directly | File downloadable via CDN | |
| 8 | Verify database record | FileAttachment entity has cdn_url populated | |
| 9 | Verify hash integrity | POST /api/v11/attachments/{fileId}/verify returns verified: true | |
| 10 | Link to token/asset | File linked successfully | |

#### Test Data
```json
{
  "testFiles": [
    { "name": "property_deed.pdf", "size": "2MB", "mimeType": "application/pdf" },
    { "name": "asset_photo.png", "size": "5MB", "mimeType": "image/png" },
    { "name": "valuation_report.xlsx", "size": "1MB", "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
  ]
}
```

#### Postconditions
- File stored in MinIO attachments bucket
- CDN URL accessible via Nginx proxy
- FileAttachment record created with cdnUrl
- SHA256 hash verified

### 4.5 TC-005: MinIO CDN Infrastructure Verification

**Priority**: P1 - High
**Type**: Infrastructure
**Estimated Duration**: 2 minutes

#### Test Steps

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Check MinIO container health | docker ps shows healthy | |
| 2 | Verify MinIO API | mc admin info minio returns stats | |
| 3 | List buckets | attachments, documents, assets exist | |
| 4 | Test Nginx CDN proxy | GET /cdn/ returns 200 | |
| 5 | Upload test file via mc | mc cp test.pdf minio/attachments/ succeeds | |
| 6 | Access via CDN | https://dlt.aurigraph.io/cdn/attachments/test.pdf returns file | |
| 7 | Verify filesystem storage | /home/subbu/minio/data contains files | |
| 8 | Delete test file | mc rm minio/attachments/test.pdf | |

---

## 5. Performance Test Cases

### 5.1 Load Testing

| Test | Concurrent Users | Duration | SLA |
|------|------------------|----------|-----|
| PERF-001 | 100 | 5 min | p95 < 500ms |
| PERF-002 | 500 | 10 min | p95 < 1000ms |
| PERF-003 | 1000 | 15 min | p95 < 2000ms |

### 5.2 Stress Testing

| Test | Load Pattern | Target |
|------|--------------|--------|
| STRESS-001 | Ramp up to 2000 users | Find breaking point |
| STRESS-002 | Spike 5000 requests/sec | Recovery time < 30s |

### 5.3 API Throughput

| Endpoint | Target TPS | Latency SLA |
|----------|------------|-------------|
| GET /health | 10,000 | < 10ms |
| GET /tokens | 5,000 | < 50ms |
| POST /tokens | 1,000 | < 200ms |

---

## 6. Security Test Cases

### 6.1 OWASP Top 10 Coverage

| ID | Vulnerability | Test Approach | Tool |
|----|---------------|---------------|------|
| SEC-001 | SQL Injection | Parameter fuzzing | sqlmap |
| SEC-002 | XSS | Input validation | OWASP ZAP |
| SEC-003 | CSRF | Token validation | Manual |
| SEC-004 | Auth Bypass | Session manipulation | Burp Suite |
| SEC-005 | Sensitive Data | Response inspection | Manual |
| SEC-006 | Security Headers | Header analysis | securityheaders.com |
| SEC-007 | Rate Limiting | DoS simulation | Custom script |
| SEC-008 | JWT Validation | Token manipulation | jwt.io |
| SEC-009 | IDOR | Object ID enumeration | Manual |
| SEC-010 | File Upload | Malicious file test | Manual |

### 6.2 API Security

| Test | Description | Expected Result |
|------|-------------|-----------------|
| No Auth | Request without token | 401 Unauthorized |
| Invalid Token | Malformed JWT | 401 Unauthorized |
| Expired Token | Old JWT | 401 Unauthorized |
| Wrong Role | User accessing admin | 403 Forbidden |
| Rate Limit | > 100 req/min | 429 Too Many Requests |

---

## 7. Test Environment Matrix

| Environment | URL | Database | Purpose |
|-------------|-----|----------|---------|
| Local | localhost:9003 | H2/PostgreSQL | Development |
| Dev | dev.aurigraph.io | PostgreSQL | Feature testing |
| Staging | staging.aurigraph.io | PostgreSQL | Pre-production |
| Production | dlt.aurigraph.io | PostgreSQL | Live system |

---

## 8. Test Execution Schedule

### 8.1 Continuous Integration

| Trigger | Tests Run | Duration |
|---------|-----------|----------|
| PR Created | Unit + Smoke | < 5 min |
| PR Merged | Smoke + Regression Bucket A | < 15 min |
| Deploy to Dev | Full Regression | < 45 min |
| Deploy to Staging | Full E2E + Security | < 1 hour |
| Deploy to Prod | Smoke + Critical Path | < 10 min |

### 8.2 Scheduled Runs

| Schedule | Tests | Duration |
|----------|-------|----------|
| Nightly | Full Suite | 2 hours |
| Weekly | Performance + Security | 4 hours |
| Monthly | Chaos Engineering | 8 hours |

---

## 9. Test Data Management

### 9.1 Test Users

| User Type | Email | KYC Level | Role |
|-----------|-------|-----------|------|
| Admin | admin@test.com | ENHANCED | ADMIN |
| Issuer | issuer@test.com | STANDARD | ISSUER |
| Investor | investor@test.com | BASIC | INVESTOR |
| Unverified | new@test.com | NONE | USER |

### 9.2 Test Assets

| Category | Asset Name | Status | Tokenized |
|----------|------------|--------|-----------|
| REAL_ESTATE | Test Property A | VERIFIED | Yes |
| CARBON_CREDITS | Test Carbon Project | VERIFIED | Yes |
| ART | Test Artwork | DRAFT | No |

---

## 10. Defect Management

### 10.1 Severity Levels

| Level | Definition | SLA |
|-------|------------|-----|
| Critical | System down, data loss | 4 hours |
| High | Major feature broken | 24 hours |
| Medium | Feature impaired | 3 days |
| Low | Minor issue | 1 week |

### 10.2 Bug Report Template

```markdown
**Summary**: [Brief description]
**Severity**: [Critical/High/Medium/Low]
**Steps to Reproduce**:
1. Step 1
2. Step 2

**Expected Result**: [What should happen]
**Actual Result**: [What actually happened]
**Environment**: [Dev/Staging/Prod]
**Screenshots/Logs**: [Attachments]
```

---

## 11. Test Automation Framework

### 11.1 Tools & Technologies

| Purpose | Tool | Version |
|---------|------|---------|
| E2E Frontend | Playwright | 1.40+ |
| API Testing | REST Assured / Pytest | Latest |
| Unit Tests (Java) | JUnit 5 | 5.10+ |
| Integration | TestContainers | 1.19+ |
| Performance | JMeter / Gatling | Latest |
| Security | OWASP ZAP | 2.14+ |
| Coverage | JaCoCo | 0.8.10+ |
| Reporting | Allure | 2.24+ |

### 11.2 Test Commands

```bash
# Run Playwright E2E Tests
cd enterprise-portal/enterprise-portal/frontend
npx playwright test --reporter=list

# Run Pytest Backend Tests
cd aurigraph-fastapi
python3 -m pytest tests/ -v --tb=short

# Run JUnit Tests
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw test

# Run with Coverage
./mvnw test jacoco:report

# Performance Tests
jmeter -n -t tests/performance/load-test.jmx -l results.jtl
```

---

## 12. Quality Gates

### 12.1 Release Criteria

| Metric | Threshold | Blocking |
|--------|-----------|----------|
| Test Pass Rate | > 98% | Yes |
| Code Coverage | > 85% | Yes |
| Critical Bugs | 0 | Yes |
| High Bugs | < 3 | Yes |
| Performance SLA | All met | Yes |
| Security Scan | No Critical/High | Yes |

### 12.2 Sign-off Checklist

- [ ] All smoke tests passing
- [ ] All regression tests passing
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Documentation updated
- [ ] Release notes prepared

---

## 13. Appendix

### 13.1 Related JIRA Tickets

- AV11-586: Backend API endpoints not responding - 502 errors
- AV11-587: Docker containers in restart loop - health check failing
- AV11-588: E2E tests needed for External Verification Integration
- AV11-589: MinIO CDN Integration Complete - File storage with SHA256 hashing
- AV11-590: File Attachment API - Upload, download, verify endpoints

### 13.2 References

- ISO/IEC 29119 Software Testing Standard
- ISTQB Foundation Level Syllabus
- OWASP Testing Guide v4.2
- Google Testing Blog Best Practices

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 11, 2025 | J4C Agent | Initial creation |
| 1.1 | Dec 12, 2025 | J4C Agent | Added MinIO CDN, File Attachments, V17 migration tests |
