# Demo API Test Suite - Integration Testing Guide

**Date**: October 24, 2025
**Status**: ✅ CREATED & DOCUMENTED
**Test File**: `src/test/java/io/aurigraph/v11/demo/api/DemoResourceIntegrationTest.java`
**Framework**: JUnit 5 + REST Assured
**Coverage**: All 10 Demo API endpoints

## Overview

This comprehensive integration test suite validates all demo management endpoints with live database persistence. Tests are organized into logical groups covering CRUD operations, lifecycle management, transactions, and persistence verification.

## Test Framework Stack

- **JUnit 5**: Modern Java testing framework with nested test organization
- **REST Assured**: Fluent REST API testing library
- **Quarkus Test**: Native Quarkus integration testing support
- **Hamcrest Matchers**: Expressive assertions

## Test Organization

### 1. **Create Demo Operations** (3 tests)
```
✓ Create new demo successfully
✓ Create demo with admin flag
✓ Create demo with custom duration
```

**Key Test**: `testCreateDemoSuccess()`
- Validates demo creation with full payload
- Verifies response status 200 and JSON content type
- Asserts demo ID, name, email, and status are non-null

### 2. **Read Demo Operations** (4 tests)
```
✓ List all demos
✓ List active demos
✓ Get demo by ID
✓ Get non-existent demo returns 404
```

**Key Test**: `testGetActiveDemos()`
- Filters for non-expired demos
- Verifies the endpoint returns a valid list
- Validates JSON response format

### 3. **Update Demo Operations** (1 test)
```
✓ Update demo merkle root
```

**Key Test**: `testUpdateDemoMerkleRoot()`
- Updates cryptographic merkle root for integrity verification
- Validates update persistence

### 4. **Demo Lifecycle Operations** (4 tests)
```
✓ Start demo
✓ Stop demo
✓ Extend demo duration (admin only)
✓ Non-admin cannot extend (auth validation)
```

**Key Tests**:
- `testStartDemo()`: Transitions demo to RUNNING state
- `testExtendDemoNonAdmin()`: Validates authorization check (expects 400)

### 5. **Transaction Management** (2 tests)
```
✓ Add transactions to demo
✓ Add transactions with merkle root
```

**Key Test**: `testAddTransactions()`
- Simulates transaction ingestion
- Verifies transaction count increments
- Validates merkle tree updates

### 6. **Delete Demo Operations** (1 test)
```
✓ Delete demo and verify removal
```

**Key Test**: `testDeleteDemo()`
- Create-delete-verify pattern
- Confirms 404 on subsequent access

### 7. **Demo Persistence Tests** (2 tests)
```
✓ Demos persist across API calls (in-database)
✓ Sample demos from database bootstrap are available
```

**Key Test**: `testDemoPersistence()`
- Validates database persistence layer (Flyway migrations)
- Verifies created demos appear in list queries
- Confirms direct retrieval after creation

**Critical**: `testSampleDemosExist()`
- Validates 3+ sample demos from V1__Create_Demos_Table.sql
- Confirms bootstrap data is available
- Tests:
  - "Supply Chain Tracking Demo"
  - "Healthcare Records Management"
  - "Financial Settlement Network"

### 8. **Error Handling Tests** (2 tests)
```
✓ Invalid demo data returns 400
✓ Operations on non-existent demo return 404
```

### 9. **API Performance Tests** (2 tests)
```
✓ GET /api/demos - Response time < 500ms
✓ POST /api/demos - Creation response time < 1000ms
```

## Demo API Endpoints Tested

| Method | Endpoint | Test | Status |
|--------|----------|------|--------|
| POST | /api/demos | testCreateDemoSuccess | ✅ |
| POST | /api/demos | testCreateAdminDemo | ✅ |
| POST | /api/demos | testCreateDemoWithDuration | ✅ |
| GET | /api/demos | testGetAllDemos | ✅ |
| GET | /api/demos/active | testGetActiveDemos | ✅ |
| GET | /api/demos/{id} | testGetDemoById | ✅ |
| GET | /api/demos/{id} | testGetNonExistentDemo | ✅ |
| PUT | /api/demos/{id} | testUpdateDemoMerkleRoot | ✅ |
| POST | /api/demos/{id}/start | testStartDemo | ✅ |
| POST | /api/demos/{id}/stop | testStopDemo | ✅ |
| POST | /api/demos/{id}/extend | testExtendDemo | ✅ |
| POST | /api/demos/{id}/extend | testExtendDemoNonAdmin | ✅ |
| POST | /api/demos/{id}/transactions | testAddTransactions | ✅ |
| POST | /api/demos/{id}/transactions | testAddTransactionsWithMerkleRoot | ✅ |
| DELETE | /api/demos/{id} | testDeleteDemo | ✅ |

**Total Tests**: 21 comprehensive tests

## Running the Tests

### Run all demo API tests
```bash
cd aurigraph-v11-standalone
./mvnw test -Dtest=DemoResourceIntegrationTest
```

### Run specific test class
```bash
./mvnw test -Dtest=DemoResourceIntegrationTest#CreateDemoTests
```

### Run with live output
```bash
./mvnw test -Dtest=DemoResourceIntegrationTest -X
```

### Run and generate coverage report
```bash
./mvnw clean test -Dtest=DemoResourceIntegrationTest jacoco:report
```

## Test Data & Fixtures

### Sample Demo Bootstrap (from Flyway migration)
```json
{
  "id": "demo_init_supply_chain_001",
  "demoName": "Supply Chain Tracking Demo",
  "userEmail": "alice.johnson@enterprise.com",
  "userName": "Alice Johnson",
  "status": "PENDING",
  "durationMinutes": 10
}
```

### Test Create Payload
```json
{
  "demoName": "Integration Test Demo",
  "userEmail": "test@example.com",
  "userName": "Test User",
  "description": "Demo created by integration test",
  "channels": [],
  "validators": [],
  "businessNodes": [],
  "slimNodes": []
}
```

## Prerequisites

1. **Database**: PostgreSQL running on localhost:5432
   - Database: `aurigraph_demos`
   - User: `aurigraph` / `aurigraph2025`

2. **Backend Service**: Quarkus app running on port 9003
   ```bash
   java -jar target/aurigraph-v11-standalone-11.4.3-runner.jar
   ```

3. **Flyway Migrations**: Applied automatically on startup
   - Creates `demos` table
   - Populates 3 sample demos

## Key Testing Patterns

### Pattern 1: Retrieve & Test
```java
// Get a demo and test it
String demoId = given()
    .when()
    .get()
    .then()
    .statusCode(200)
    .extract()
    .path("[0].id");  // Extract first ID from list
```

### Pattern 2: Create-Verify-Delete
```java
// Create, verify existence, then delete
String id = createDemo();
verifyDemoExists(id);
deleteDemo(id);
verifyDemoNotExists(id);
```

### Pattern 3: Response Validation
```java
given()
    .when()
    .get("/" + demoId)
    .then()
    .statusCode(200)
    .body("id", equalTo(demoId))
    .body("demoName", notNullValue());
```

## Database Persistence Validation

### What's Tested
1. **Data Durability**: Created demos survive API calls
2. **Query Consistency**: List queries include newly created demos
3. **Bootstrap Data**: Sample demos are available from startup
4. **CRUD Cycle**: Create → Read → Update → Delete → Verify Removal

### Key Assertion
```java
// Verify demo count increased after creation
.body("$", hasSize(greaterThan(initialCount)))

// Verify specific demo in list
.body("id", hasItem(createdId))
```

## Performance Baselines

| Operation | Target | Assertion |
|-----------|--------|-----------|
| GET /api/demos | <500ms | `time(lessThan(500L), MILLISECONDS)` |
| POST /api/demos | <1000ms | `time(lessThan(1000L), MILLISECONDS)` |
| GET /api/demos/{id} | <200ms | (implicit in responsive systems) |

## Error Scenarios Covered

| Scenario | Expected | Test |
|----------|----------|------|
| Invalid demo data | 400/422 | `testInvalidDemoCreation()` |
| Missing required fields | 400/422 | (part of validation) |
| Non-existent demo | 404 | `testGetNonExistentDemo()` |
| Non-admin extend | 400 | `testExtendDemoNonAdmin()` |

## Integration Points

### Database (Flyway)
- ✅ Tables automatically created on first run
- ✅ Sample data inserted via V1__Create_Demos_Table.sql
- ✅ Panache ORM manages persistence

### Frontend (Enterprise Portal)
- Frontend calls POST /api/demos to create
- Frontend calls GET /api/demos to list
- Frontend calls DELETE /api/demos/{id} to remove
- All data is persisted and survives application restart

### Backend (DemoResource.java)
- Provides all 10 endpoints
- Uses Panache for database operations
- Validates input and handles errors
- Returns proper HTTP status codes

## Troubleshooting

### Tests Failing - Database Not Found
```
Solution: Ensure PostgreSQL is running and migrations executed
./mvnw quarkus:dev  # This runs migrations automatically
```

### Tests Timeout
```
Solution: Increase timeout in REST Assured
RestAssured.config = config().httpClient(
    HttpClientConfig.httpClientFactory(
        new HttpClientFactory() {
            ...
            timeout = 5000  // 5 seconds
        }
    )
);
```

### Port 9003 Already in Use
```bash
# Kill existing process
lsof -i :9003 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or use different port in test
RestAssured.port = 9004;
```

## Future Enhancements

### Phase 2 (Scheduled)
- [ ] Add MockMvc tests for isolated endpoint testing
- [ ] Add TestContainers for database isolation
- [ ] Add performance benchmarking with JMH
- [ ] Add security/authorization tests
- [ ] Add concurrent access tests

### Test Coverage Goals
- **Current**: 21 integration tests covering happy path + errors
- **Target**: 95% line coverage with unit tests + integration tests
- **Critical Paths**: CRUD operations (100%), persistence (100%), auth (95%)

## Documentation References

- [Demo API Implementation](./DEMO-PERSISTENCE-FIX.md)
- [Quarkus Testing Guide](https://quarkus.io/guides/getting-started-testing)
- [REST Assured Documentation](https://rest-assured.io/)
- [Hamcrest Matchers](http://hamcrest.org/JavaHamcrest/)

## Summary

This test suite provides **comprehensive validation** of demo persistence features:

✅ **21 tests** covering all scenarios
✅ **CRUD operations** fully tested
✅ **Persistence layer** validated
✅ **Error handling** verified
✅ **Performance baselines** established
✅ **Bootstrap data** confirmed

The tests can be run locally, in CI/CD pipelines, and serve as living documentation of the API contract.
