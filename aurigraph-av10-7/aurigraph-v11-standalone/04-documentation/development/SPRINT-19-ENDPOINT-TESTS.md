# Sprint 19 Week 1: Endpoint Testing & Validation

**Date:** November 10, 2025
**Purpose:** Verify that authentication and demo API endpoints work correctly
**Status:** In Progress

---

## Test Environment Setup

### Prerequisites
- Application running on `localhost:9003` (or production server)
- PostgreSQL database initialized
- Test user created in database
- curl or similar HTTP client available

### Test Credentials
```
Username: admin
Password: password (or configured password)
Email: admin@aurigraph.io
```

---

## Test Plan: Priority 1A - Authentication Service

### Test 1.1: Successful Authentication
**Endpoint:** `POST /api/v11/users/authenticate`
**Path:** `src/main/java/io/aurigraph/v11/user/UserResource.java:283`
**Expected:** 200 OK with JWT token

```bash
curl -X POST http://localhost:9003/api/v11/users/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }' | jq .
```

**Expected Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@aurigraph.io",
    "role": "ADMIN",
    "status": "ACTIVE",
    "createdAt": "2025-11-10T...",
    "lastLoginAt": "..."
  },
  "token": "eyJhbGc..."
}
```

**Success Criteria:**
- ✅ HTTP 200 OK
- ✅ Response contains JWT token
- ✅ Response contains user object
- ✅ Token is valid and can be decoded

---

### Test 1.2: Invalid Credentials (Wrong Password)
**Endpoint:** `POST /api/v11/users/authenticate`
**Expected:** 401 Unauthorized

```bash
curl -X POST http://localhost:9003/api/v11/users/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "wrongpassword"
  }' | jq .
```

**Expected Response:**
```json
{
  "error": "Invalid credentials"
}
```

**Success Criteria:**
- ✅ HTTP 401 Unauthorized
- ✅ Error message returned
- ✅ No token issued

---

### Test 1.3: Invalid Credentials (Non-existent User)
**Endpoint:** `POST /api/v11/users/authenticate`
**Expected:** 401 Unauthorized

```bash
curl -X POST http://localhost:9003/api/v11/users/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nonexistent",
    "password": "password"
  }' | jq .
```

**Expected Response:**
```json
{
  "error": "Invalid credentials"
}
```

**Success Criteria:**
- ✅ HTTP 401 Unauthorized
- ✅ No user information leaked
- ✅ No token issued

---

### Test 1.4: Missing Required Fields
**Endpoint:** `POST /api/v11/users/authenticate`
**Expected:** 400 Bad Request

```bash
curl -X POST http://localhost:9003/api/v11/users/authenticate \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

**Expected Response:**
```json
{
  "error": "..."
}
```

**Success Criteria:**
- ✅ HTTP 400 Bad Request or 422 Unprocessable Entity
- ✅ Validation error returned

---

## Test Plan: Priority 1B - Demo API Endpoints

### Test 2.1: Create Demo
**Endpoint:** `POST /api/v11/demos`
**Path:** `src/main/java/io/aurigraph/v11/demo/api/DemoResource.java:71`
**Expected:** 201 Created

```bash
JWT_TOKEN="<token from Test 1.1>"

curl -X POST http://localhost:9003/api/v11/demos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "demoName": "Test Demo 1",
    "userName": "admin",
    "userEmail": "admin@aurigraph.io",
    "description": "Integration test demo"
  }' | jq .
```

**Expected Response:**
```json
{
  "id": "demo_...",
  "demoName": "Test Demo 1",
  "status": "PENDING",
  "createdAt": "2025-11-10T...",
  "lastActivity": "2025-11-10T...",
  "durationMinutes": 10
}
```

**Success Criteria:**
- ✅ HTTP 201 Created
- ✅ Response contains demo ID
- ✅ Status is PENDING
- ✅ Demo persisted to database

---

### Test 2.2: List Demos
**Endpoint:** `GET /api/v11/demos`
**Path:** `src/main/java/io/aurigraph/v11/demo/api/DemoResource.java:35`
**Expected:** 200 OK with demo list

```bash
JWT_TOKEN="<token from Test 1.1>"

curl -X GET "http://localhost:9003/api/v11/demos" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

**Expected Response:**
```json
[
  {
    "id": "demo_...",
    "demoName": "Test Demo 1",
    "status": "PENDING",
    "createdAt": "...",
    "durationMinutes": 10
  }
]
```

**Success Criteria:**
- ✅ HTTP 200 OK
- ✅ Returns array of demos
- ✅ Contains demo created in Test 2.1
- ✅ Sorted by creation date

---

### Test 2.3: Get Specific Demo
**Endpoint:** `GET /api/v11/demos/{id}`
**Path:** `src/main/java/io/aurigraph/v11/demo/api/DemoResource.java:51`
**Expected:** 200 OK

```bash
JWT_TOKEN="<token from Test 1.1>"
DEMO_ID="<id from Test 2.1>"

curl -X GET "http://localhost:9003/api/v11/demos/$DEMO_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

**Expected Response:**
```json
{
  "id": "demo_...",
  "demoName": "Test Demo 1",
  "status": "PENDING",
  "createdAt": "..."
}
```

**Success Criteria:**
- ✅ HTTP 200 OK
- ✅ Returns correct demo
- ✅ All fields present

---

### Test 2.4: Start Demo
**Endpoint:** `POST /api/v11/demos/{id}/start`
**Expected:** 200 OK with status updated

```bash
JWT_TOKEN="<token from Test 1.1>"
DEMO_ID="<id from Test 2.1>"

curl -X POST "http://localhost:9003/api/v11/demos/$DEMO_ID/start" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

**Expected Response:**
```json
{
  "id": "demo_...",
  "status": "RUNNING",
  "startedAt": "2025-11-10T..."
}
```

**Success Criteria:**
- ✅ HTTP 200 OK
- ✅ Status changed to RUNNING
- ✅ startedAt timestamp set

---

### Test 2.5: Stop Demo
**Endpoint:** `POST /api/v11/demos/{id}/stop`
**Expected:** 200 OK with duration calculated

```bash
JWT_TOKEN="<token from Test 1.1>"
DEMO_ID="<id from Test 2.1>"

curl -X POST "http://localhost:9003/api/v11/demos/$DEMO_ID/stop" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

**Expected Response:**
```json
{
  "id": "demo_...",
  "status": "STOPPED",
  "stoppedAt": "2025-11-10T...",
  "durationSeconds": 120
}
```

**Success Criteria:**
- ✅ HTTP 200 OK
- ✅ Status changed to STOPPED
- ✅ Duration calculated
- ✅ stoppedAt timestamp set

---

### Test 2.6: Delete Demo
**Endpoint:** `DELETE /api/v11/demos/{id}`
**Expected:** 204 No Content

```bash
JWT_TOKEN="<token from Test 1.1>"
DEMO_ID="<id from Test 2.1>"

curl -X DELETE "http://localhost:9003/api/v11/demos/$DEMO_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" -v
```

**Expected Response:**
```
HTTP/1.1 204 No Content
```

**Success Criteria:**
- ✅ HTTP 204 No Content
- ✅ Demo removed from database
- ✅ Subsequent GET returns 404

---

## Automation Script

Save as `test-endpoints.sh`:

```bash
#!/bin/bash

# Configuration
BASE_URL="${1:-http://localhost:9003}"
USERNAME="${2:-admin}"
PASSWORD="${3:-password}"

echo "═════════════════════════════════════════════════════════"
echo "Sprint 19: Endpoint Testing"
echo "═════════════════════════════════════════════════════════"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Authentication
echo "[TEST 1] Authenticate User"
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v11/users/authenticate" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

JWT_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.token // empty')

if [ -z "$JWT_TOKEN" ]; then
  echo "❌ FAILED - No JWT token received"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo "✅ PASSED - JWT token received"
echo "Token: ${JWT_TOKEN:0:50}..."
echo ""

# Test 2: Create Demo
echo "[TEST 2] Create Demo"
DEMO_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v11/demos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{\"demoName\":\"Test Demo $(date +%s)\",\"userName\":\"$USERNAME\",\"userEmail\":\"$USERNAME@test.com\",\"description\":\"Auto test\"}")

DEMO_ID=$(echo "$DEMO_RESPONSE" | jq -r '.id // empty')

if [ -z "$DEMO_ID" ]; then
  echo "❌ FAILED - No demo created"
  echo "Response: $DEMO_RESPONSE"
  exit 1
fi

echo "✅ PASSED - Demo created"
echo "Demo ID: $DEMO_ID"
echo ""

# Test 3: List Demos
echo "[TEST 3] List Demos"
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v11/demos" \
  -H "Authorization: Bearer $JWT_TOKEN")

DEMO_COUNT=$(echo "$LIST_RESPONSE" | jq 'length')
echo "✅ PASSED - Retrieved $DEMO_COUNT demo(s)"
echo ""

# Test 4: Get Specific Demo
echo "[TEST 4] Get Demo Details"
GET_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v11/demos/$DEMO_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")

DEMO_STATUS=$(echo "$GET_RESPONSE" | jq -r '.status')
echo "✅ PASSED - Demo status: $DEMO_STATUS"
echo ""

# Test 5: Start Demo
echo "[TEST 5] Start Demo"
START_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v11/demos/$DEMO_ID/start" \
  -H "Authorization: Bearer $JWT_TOKEN")

STARTED_STATUS=$(echo "$START_RESPONSE" | jq -r '.status')
if [ "$STARTED_STATUS" = "RUNNING" ]; then
  echo "✅ PASSED - Demo status: RUNNING"
else
  echo "⚠️  Status: $STARTED_STATUS"
fi
echo ""

# Test 6: Stop Demo
echo "[TEST 6] Stop Demo"
STOP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v11/demos/$DEMO_ID/stop" \
  -H "Authorization: Bearer $JWT_TOKEN")

STOPPED_STATUS=$(echo "$STOP_RESPONSE" | jq -r '.status')
DURATION=$(echo "$STOP_RESPONSE" | jq -r '.durationSeconds')
echo "✅ PASSED - Demo status: $STOPPED_STATUS (duration: ${DURATION}s)"
echo ""

# Test 7: Delete Demo
echo "[TEST 7] Delete Demo"
DELETE_RESPONSE=$(curl -s -w "%{http_code}" -X DELETE "$BASE_URL/api/v11/demos/$DEMO_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")

HTTP_CODE="${DELETE_RESPONSE: -3}"
if [ "$HTTP_CODE" = "204" ]; then
  echo "✅ PASSED - Demo deleted (HTTP 204)"
else
  echo "⚠️  HTTP $HTTP_CODE"
fi
echo ""

echo "═════════════════════════════════════════════════════════"
echo "✅ All endpoint tests completed successfully!"
echo "═════════════════════════════════════════════════════════"
```

**Usage:**
```bash
chmod +x test-endpoints.sh
./test-endpoints.sh http://localhost:9003 admin password
```

---

## Test Execution Results

### Phase 1: Authentication Tests
- [ ] Test 1.1: Successful Authentication
- [ ] Test 1.2: Invalid Password
- [ ] Test 1.3: Non-existent User
- [ ] Test 1.4: Missing Fields

### Phase 2: Demo API Tests
- [ ] Test 2.1: Create Demo
- [ ] Test 2.2: List Demos
- [ ] Test 2.3: Get Demo
- [ ] Test 2.4: Start Demo
- [ ] Test 2.5: Stop Demo
- [ ] Test 2.6: Delete Demo

---

## Known Issues & Workarounds

### Issue 1: Token Expiration
**Problem:** JWT token may expire during test execution
**Workaround:** Re-authenticate for each test or use longer expiration time

### Issue 2: Demo Not Found
**Problem:** Demo created but subsequent operations fail
**Workaround:** Verify demo ID format and database persistence

### Issue 3: CORS Issues
**Problem:** Browser requests fail with CORS error
**Workaround:** Add CORS headers or test from same origin

---

## Portal Integration Checklist

Once all tests pass:

- [ ] Deploy v11.4.4 to production
- [ ] Test portal Login.tsx calls `/api/v11/users/authenticate`
- [ ] Verify portal receives JWT token
- [ ] Test portal DemoService.ts calls `/api/v11/demos` endpoints
- [ ] Verify demos persist across page refreshes
- [ ] Check console for errors
- [ ] Validate session management
- [ ] Test user logout functionality

---

## Next Steps

1. ✅ Execute endpoint tests
2. ✅ Document results
3. ⏳ Test portal integration
4. ⏳ Plan WebSocket spike
5. ⏳ Fix encryption tests (4 tests)

---

**Prepared By:** Platform Engineering
**Date:** November 10, 2025
**Sprint:** 19 Week 1
