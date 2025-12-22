# API Endpoint Implementation Plan - SPRINT, E2E & SPARC
**Created**: December 22, 2025, 21:04 IST
**Objective**: Fix 4 failing endpoint tests in UIEndToEndTest
**Methodology**: SPRINT Planning + E2E Testing + SPARC Implementation

---

## 📋 **SPRINT PLANNING**

### **Sprint Goal**: Fix All Failing API Endpoints
**Sprint Duration**: 2-3 hours
**Story Points**: 10 SP
**Priority**: High (P1)

### **User Stories**:

#### **Story 1: Platform Status Endpoint** (2 SP)
**As a** dashboard user  
**I want** to view platform status  
**So that** I can monitor system health

**Acceptance Criteria**:
- [ ] GET `/api/v11/status` returns 200 OK
- [ ] Response includes `status` field
- [ ] Response includes `version` field
- [ ] Response includes service health status
- [ ] No authentication required (public endpoint)

#### **Story 2: Performance Metrics Endpoint** (2 SP)
**As a** dashboard user  
**I want** to view performance metrics  
**So that** I can monitor TPS and transaction counts

**Acceptance Criteria**:
- [ ] GET `/api/v11/performance/metrics` returns 200 OK
- [ ] Response includes `currentTPS` field (≥ 0)
- [ ] Response includes `totalTransactions` field (≥ 0)
- [ ] Response includes latency metrics
- [ ] No authentication required (public endpoint)

#### **Story 3: Data Feeds Endpoint** (3 SP)
**As a** feed manager  
**I want** to view registered data feeds  
**So that** I can manage feed configurations

**Acceptance Criteria**:
- [ ] GET `/api/v11/datafeeds` returns 200 OK
- [ ] Response includes `feeds` array
- [ ] Authentication disabled for tests
- [ ] Returns mock data for testing

#### **Story 4: Token Stats Endpoint** (3 SP)
**As a** token dashboard user  
**I want** to view token statistics  
**So that** I can monitor market cap and token metrics

**Acceptance Criteria**:
- [ ] GET `/api/v11/feed-tokens/stats` returns 200 OK
- [ ] Response includes `totalMarketCap` field
- [ ] Authentication disabled for tests
- [ ] Returns mock data for testing

---

## 🔄 **END-TO-END (E2E) TESTING PLAN**

### **Test Scenarios**:

#### **E2E-1: Platform Status Flow**
```
User → Dashboard → GET /api/v11/status → Display Status
```
**Steps**:
1. User opens dashboard
2. Dashboard calls `/api/v11/status`
3. API returns status JSON
4. Dashboard displays system health

**Expected Result**: Status shows "OPERATIONAL"

#### **E2E-2: Performance Metrics Flow**
```
User → Dashboard → GET /api/v11/performance/metrics → Display Charts
```
**Steps**:
1. User views performance charts
2. Dashboard calls `/api/v11/performance/metrics`
3. API returns metrics JSON
4. Dashboard renders TPS chart

**Expected Result**: Charts display 3M+ TPS

#### **E2E-3: Data Feeds Flow**
```
User → Feed Manager → GET /api/v11/datafeeds → Display Feeds
```
**Steps**:
1. User opens feed manager
2. UI calls `/api/v11/datafeeds`
3. API returns feeds array
4. UI displays feed list

**Expected Result**: Feed list displayed

#### **E2E-4: Token Stats Flow**
```
User → Token Dashboard → GET /api/v11/feed-tokens/stats → Display Stats
```
**Steps**:
1. User opens token dashboard
2. UI calls `/api/v11/feed-tokens/stats`
3. API returns stats JSON
4. UI displays market cap

**Expected Result**: Market cap displayed

---

## 🏗️ **SPARC IMPLEMENTATION PLAN**

### **SPARC-1: Platform Status Endpoint**

#### **S - Specification**
```
Endpoint: GET /api/v11/status
Authentication: None (public)
Response Format: JSON
Status Code: 200 OK

Response Schema:
{
  "status": "OPERATIONAL" | "DEGRADED" | "DOWN",
  "version": "12.0.0",
  "environment": "production" | "development" | "test",
  "timestamp": "ISO-8601 timestamp",
  "uptime": "duration string",
  "services": {
    "blockchain": "healthy" | "unhealthy",
    "consensus": "healthy" | "unhealthy",
    "storage": "healthy" | "unhealthy",
    "api": "healthy" | "unhealthy"
  }
}
```

#### **P - Pseudocode**
```java
@GET
@Path("/api/v11/status")
public Response getPlatformStatus() {
    // 1. Create status map
    // 2. Add version info
    // 3. Add service health checks
    // 4. Add timestamp
    // 5. Return 200 OK with JSON
}
```

#### **A - Architecture**
```
PlatformStatusResource.java
├── @Path("/api/v11/status")
├── @GET getPlatformStatus()
└── Returns: Response with status JSON
```

**Location**: `src/main/java/io/aurigraph/v11/api/PlatformStatusResource.java`

#### **R - Refinement**
- Use HashMap for flexible response structure
- Include all required fields from test
- No external dependencies (simple static response)
- Add OpenAPI annotations for documentation

#### **C - Completion Checklist**
- [x] File created: PlatformStatusResource.java
- [ ] Endpoint tested: GET /api/v11/status
- [ ] Test passes: testPlatformStatusEndpoint
- [ ] Documentation added
- [ ] Code committed

---

### **SPARC-2: Performance Metrics Endpoint**

#### **S - Specification**
```
Endpoint: GET /api/v11/performance/metrics
Authentication: None (public)
Response Format: JSON
Status Code: 200 OK

Response Schema:
{
  "currentTPS": number (≥ 0),
  "peakTPS": number,
  "averageTPS": number,
  "totalTransactions": number (≥ 0),
  "pendingTransactions": number,
  "confirmedTransactions": number,
  "failedTransactions": number,
  "totalBlocks": number,
  "averageBlockTime": number (ms),
  "activeValidators": number,
  "networkHealth": "HEALTHY" | "DEGRADED" | "CRITICAL",
  "p50Latency": number (ms),
  "p95Latency": number (ms),
  "p99Latency": number (ms),
  "timestamp": "ISO-8601 timestamp"
}
```

#### **P - Pseudocode**
```java
@GET
@Path("/metrics")
public Response getPerformanceMetrics() {
    // 1. Create metrics map
    // 2. Add TPS metrics (current, peak, average)
    // 3. Add transaction counts
    // 4. Add block statistics
    // 5. Add network health
    // 6. Add latency metrics
    // 7. Add timestamp
    // 8. Return 200 OK with JSON
}
```

#### **A - Architecture**
```
PerformanceMetricsResource.java
├── @Path("/api/v11/performance")
├── @GET @Path("/metrics") getPerformanceMetrics()
└── Returns: Response with metrics JSON
```

**Location**: `src/main/java/io/aurigraph/v11/api/PerformanceMetricsResource.java`

#### **R - Refinement**
- Return realistic metrics (3M TPS target)
- Include all fields required by test
- Add comprehensive metrics for dashboard
- Future: Connect to actual metrics service

#### **C - Completion Checklist**
- [x] File created: PerformanceMetricsResource.java
- [ ] Endpoint tested: GET /api/v11/performance/metrics
- [ ] Test passes: testPerformanceMetricsEndpoint
- [ ] Documentation added
- [ ] Code committed

---

### **SPARC-3: Data Feeds Endpoint**

#### **S - Specification**
```
Endpoint: GET /api/v11/datafeeds
Authentication: Required (disabled for tests)
Response Format: JSON
Status Code: 200 OK

Response Schema:
{
  "feeds": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "status": "active" | "inactive",
      "lastUpdate": "ISO-8601 timestamp"
    }
  ],
  "total": number,
  "timestamp": "ISO-8601 timestamp"
}
```

#### **P - Pseudocode**
```java
@GET
@Path("/api/v11/datafeeds")
public Response getDataFeeds() {
    // 1. Create response map
    // 2. Create feeds array with mock data
    // 3. Add feed objects (id, name, type, status)
    // 4. Add total count
    // 5. Add timestamp
    // 6. Return 200 OK with JSON
}
```

#### **A - Architecture**
```
DataFeedsResource.java
├── @Path("/api/v11/datafeeds")
├── @GET getDataFeeds()
└── Returns: Response with feeds array
```

**Location**: `src/main/java/io/aurigraph/v11/api/DataFeedsResource.java`

#### **R - Refinement**
- Return mock data for testing
- Disable authentication in test profile
- Include realistic feed examples
- Future: Connect to actual feed registry

#### **C - Completion Checklist**
- [ ] File created: DataFeedsResource.java
- [ ] Endpoint tested: GET /api/v11/datafeeds
- [ ] Test passes: testDataFeedsEndpoint
- [ ] Authentication disabled for tests
- [ ] Code committed

---

### **SPARC-4: Token Stats Endpoint**

#### **S - Specification**
```
Endpoint: GET /api/v11/feed-tokens/stats
Authentication: Required (disabled for tests)
Response Format: JSON
Status Code: 200 OK

Response Schema:
{
  "totalMarketCap": number,
  "totalTokens": number,
  "activeTokens": number,
  "totalHolders": number,
  "24hVolume": number,
  "24hChange": number (percentage),
  "timestamp": "ISO-8601 timestamp"
}
```

#### **P - Pseudocode**
```java
@GET
@Path("/stats")
public Response getTokenStats() {
    // 1. Create stats map
    // 2. Add totalMarketCap
    // 3. Add token counts
    // 4. Add holder statistics
    // 5. Add volume metrics
    // 6. Add timestamp
    // 7. Return 200 OK with JSON
}
```

#### **A - Architecture**
```
FeedTokensResource.java
├── @Path("/api/v11/feed-tokens")
├── @GET @Path("/stats") getTokenStats()
└── Returns: Response with stats JSON
```

**Location**: `src/main/java/io/aurigraph/v11/api/FeedTokensResource.java`

#### **R - Refinement**
- Return mock data for testing
- Disable authentication in test profile
- Include realistic market cap
- Future: Connect to actual token service

#### **C - Completion Checklist**
- [ ] File created: FeedTokensResource.java
- [ ] Endpoint tested: GET /api/v11/feed-tokens/stats
- [ ] Test passes: testTokenStatsEndpoint
- [ ] Authentication disabled for tests
- [ ] Code committed

---

## 📊 **IMPLEMENTATION SEQUENCE**

### **Phase 1: Create Resources** (15 minutes)
1. ✅ PlatformStatusResource.java (already created)
2. ✅ PerformanceMetricsResource.java (already created)
3. ⏳ DataFeedsResource.java (next)
4. ⏳ FeedTokensResource.java (next)

### **Phase 2: Disable Authentication** (5 minutes)
5. ⏳ Update application.properties test config
6. ⏳ Add @PermitAll annotations if needed

### **Phase 3: Test & Verify** (10 minutes)
7. ⏳ Run UIEndToEndTest
8. ⏳ Verify all 5 tests pass
9. ⏳ Check response formats

### **Phase 4: Documentation & Commit** (10 minutes)
10. ⏳ Add OpenAPI documentation
11. ⏳ Update JIRA
12. ⏳ Commit and push

**Total Estimated Time**: 40 minutes

---

## ✅ **ACCEPTANCE CRITERIA**

### **Definition of Done**:
- [ ] All 4 resource files created
- [ ] All 5 tests in UIEndToEndTest pass
- [ ] No authentication errors (401)
- [ ] No server errors (500)
- [ ] Response formats match test expectations
- [ ] OpenAPI documentation added
- [ ] Code committed and pushed
- [ ] JIRA tickets updated

### **Test Success Criteria**:
```bash
./mvnw test -Dtest=UIEndToEndTest

Expected Result:
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
```

---

## 🎯 **RISK MITIGATION**

### **Potential Issues**:
1. **Authentication still enabled**: Add @PermitAll or disable in test config
2. **Response format mismatch**: Verify JSON structure matches test expectations
3. **Path conflicts**: Ensure no duplicate @Path declarations
4. **Dependency injection**: Ensure resources are discovered by Quarkus

### **Mitigation Strategies**:
- Test each endpoint individually after creation
- Use RestAssured to verify response structure
- Check application.properties test overrides
- Verify JAX-RS resource scanning

---

## 📝 **NOTES**

- All endpoints return mock/static data for now
- Future enhancement: Connect to actual services
- Authentication disabled only in test profile
- Production will require proper authentication
- OpenAPI documentation auto-generated from annotations

---

**Next Action**: Create DataFeedsResource.java and FeedTokensResource.java
**Status**: Phase 1 - 50% Complete (2/4 resources created)
